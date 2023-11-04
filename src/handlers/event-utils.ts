import { Interaction, Message } from 'discord.js';
import {
    EMPTY,
    Observable,
    concatMap,
    filter,
    from,
    of,
    throwError,
    tap,
    MonoTypeOperatorFunction,
    catchError,
    finalize,
} from 'rxjs';
import {
    Files,
    Id,
    callPlugin,
    everyPluginOk,
    filterMapTo,
    handleError,
    SernError,
    VoidResult,
    useContainerRaw,
} from '../core/_internal';
import { Emitter, ErrorHandling, Logging, ModuleManager } from '../core';
import { contextArgs, createDispatcher } from './dispatchers';
import { ObservableInput, pipe } from 'rxjs';
import { SernEmitter } from '../core';
import { Err, Ok, Result } from 'ts-results-es';
import type { Awaitable } from '../types/utility';
import type { ControlPlugin } from '../types/core-plugin';
import type { AnyModule, CommandModule, Module, Processed } from '../types/core-modules';
import type { ImportPayload } from '../types/core';

function createGenericHandler<Source, Narrowed extends Source, Output>(
    source: Observable<Source>,
    makeModule: (event: Narrowed) => Promise<Output>,
) {
    return (pred: (i: Source) => i is Narrowed) => 
        source.pipe(
            filter(pred),
            concatMap(makeModule));
}

/**
 * Removes the first character(s) _[depending on prefix length]_ of the message
 * @param msg
 * @param prefix The prefix to remove
 * @returns The message without the prefix
 * @example
 * message.content = '!ping';
 * console.log(fmt(message, '!'));
 * // [ 'ping' ]
 */
export function fmt(msg: string, prefix: string): string[] {
    return msg.slice(prefix.length).trim().split(/\s+/g);
}

/**
 *
 * Creates an RxJS observable that filters and maps incoming interactions to their respective modules.
 * @param i An RxJS observable of interactions.
 * @param mg The module manager instance used to retrieve the module path for each interaction.
 * @returns A handler to create a RxJS observable of dispatchers that take incoming interactions and execute their corresponding modules.
 */
export function createInteractionHandler<T extends Interaction>(
    source: Observable<Interaction>,
    mg: ModuleManager,
) {
    return createGenericHandler<Interaction, T, Result<ReturnType<typeof createDispatcher>, void>>(
        source,
        async event => {
            const fullPath = mg.get(Id.reconstruct(event));
            if(!fullPath) {
                return Err.EMPTY
            }
            return Files
                .defaultModuleLoader<Processed<CommandModule>>(fullPath)
                .then(payload =>
                   Ok(createDispatcher({ module: payload.module, event })));
        },
    );
}

export function createMessageHandler(
    source: Observable<Message>,
    defaultPrefix: string,
    mg: ModuleManager,
) {
    return createGenericHandler(source, async event => {
        const [prefix, ...rest] = fmt(event.content, defaultPrefix);
        const fullPath = mg.get(`${prefix}_A1`);

        if(!fullPath) {
            return Err('Possibly undefined behavior: could not find a static id to resolve  ')
        }
        return Files
            .defaultModuleLoader<Processed<CommandModule>>(fullPath)
            .then(({ module })=> {
                const args = contextArgs(event, rest);
                return Ok({ module, args });
            });
    });
}
/**
 * IMPURE SIDE EFFECT
 * This function assigns remaining, incomplete data to each imported module.
 */
function assignDefaults<T extends Module>(
    moduleManager: ModuleManager,
): MonoTypeOperatorFunction<ImportPayload<T>> {
    return tap(({ module, absPath }) => {
        module.name ??= Files.filename(absPath);
        module.description ??= '...';
        moduleManager.setMetadata(module, {
            isClass: module.constructor.name === 'Function',
            fullPath: absPath,
            id: Id.create(module.name, module.type),
        });
    });
}

export function buildModules<T extends AnyModule>(
    input: ObservableInput<string>,
    moduleManager: ModuleManager,
) {
    return Files
        .buildModuleStream<Processed<T>>(input)
        .pipe(assignDefaults(moduleManager));
}

/**
 * Wraps the task in a Result as a try / catch.
 * if the task is ok, an event is emitted and the stream becomes empty
 * if the task is an error, throw an error down the stream which will be handled by catchError
 * @param emitter reference to SernEmitter that will emit a successful execution of module
 * @param module the module that will be executed with task
 * @param task the deferred execution which will be called
 */
export function executeModule(
    emitter: Emitter,
    {
        module,
        task,
    }: {
        module: Processed<Module>;
        task: () => Awaitable<unknown>;
    },
) {
    return of(module).pipe(
        //converting the task into a promise so rxjs can resolve the Awaitable properly
        concatMap(() => Result.wrapAsync(async () => task())),
        concatMap(result => {
            if (result.isOk()) {
                emitter.emit('module.activate', SernEmitter.success(module));
                return EMPTY;
            } else {
                return throwError(() => SernEmitter.failure(module, result.error));
            }
        }),
    );
}

/**
 * A higher order function that
 * - creates a stream of {@link VoidResult} { config.createStream }
 * - any failures results to { config.onFailure } being called
 * - if all results are ok, the stream is converted to { config.onNext }
 * emit config.onSuccess Observable
 * @param config
 * @returns receiver function for flattening a stream of data
 */
export function createResultResolver<
    T extends { execute: (...args: any[]) => any; onEvent: ControlPlugin[] },
    Args extends { module: T; [key: string]: unknown },
    Output,
>(config: {
    onStop?: (module: T) => unknown;
    onNext: (args: Args) => Output;
    createStream: (args: Args) => Observable<VoidResult>;
}) {
    return (args: Args) => {
        const task$ = config.createStream(args);
        return task$.pipe(
            tap(result => {
                result.isErr() && config.onStop?.(args.module);
            }),
            everyPluginOk,
            filterMapTo(() => config.onNext(args)),
        );
    };
}

/**
 * Calls a module's init plugins and checks for Err. If so, call { onStop } and
 * ignore the module
 */
export function callInitPlugins<T extends Processed<AnyModule>>(sernEmitter: Emitter) {
    return concatMap(
        createResultResolver({
            createStream: args => from(args.module.plugins).pipe(callPlugin(args)),
            onStop: (module: T) => {
                sernEmitter.emit(
                    'module.register',
                    SernEmitter.failure(module, SernError.PluginFailure),
                );
            },
            onNext: ({ module }) => {
                sernEmitter.emit('module.register', SernEmitter.success(module));
                return module;
            },
        }),
    );
}

/**
 * Creates an executable task ( execute the command ) if  all control plugins are successful
 * @param onStop emits a failure response to the SernEmitter
 */
export function makeModuleExecutor<
    M extends Processed<Module>,
    Args extends { module: M; args: unknown[] },
>(onStop: (m: M) => unknown) {
    const onNext = ({ args, module }: Args) => ({
        task: () => module.execute(...args),
        module,
    });
    return concatMap(
        createResultResolver({
            onStop,
            createStream: ({ args, module }) => from(module.onEvent).pipe(callPlugin(args)),
            onNext,
        }),
    );
}

export const handleCrash = (err: ErrorHandling, log?: Logging) =>
    pipe(
        catchError(handleError(err, log)),
        finalize(() => {
            log?.info({
                message: 'A stream closed or reached end of lifetime',
            });
            useContainerRaw()
                ?.disposeAll()
                .then(() => log?.info({ message: 'Cleaning container and crashing' }));
        }),
    );
