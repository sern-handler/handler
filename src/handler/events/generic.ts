import {
    Interaction,
    InteractionType,
    Message,
} from 'discord.js';
import { EMPTY, Observable, concatMap, filter, from, map, of, throwError, tap } from 'rxjs';
import { ModuleManager } from '../../core';
import { SernError } from '../../core/structures/errors';
import { callPlugin, everyPluginOk, filterMap, filterMapTo } from '../../core/operators';
import { defaultModuleLoader } from '../../core/module-loading';
import { CommandModule, Module, AnyModule } from '../../core/types/modules';
import { contextArgs, createDispatcher, dispatchMessage } from './dispatchers';
import { ObservableInput, pipe, switchMap } from 'rxjs';
import { SernEmitter } from '../../core';
import { errTap } from '../../core/operators';
import * as Files from '../../core/module-loading';
import { sernMeta } from '../commands';
import { Err, Result } from 'ts-results-es';
import { fmt } from './messages';
import { ControlPlugin, VoidResult } from '../../core/types/plugins';
import { ImportPayload, Processed } from '../types';
import { Awaitable } from '../../shared';

function createGenericHandler<Source, Narrowed extends Source, Output>(
    source: Observable<Source>,
    makeModule: (event: Narrowed) => Awaitable<Result<Output, unknown>>,
) {
    return (pred: (i: Source) => i is Narrowed) => source.pipe(filter(pred), filterMap(makeModule));
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
    return createGenericHandler<Interaction, T, ReturnType<typeof createDispatcher>>(
        source,
        event => {
            const fullPath = mg.get(createId(event as unknown as Interaction));
            if (!fullPath)
                return Err(SernError.UndefinedModule + ' No full path found in module store');
            return defaultModuleLoader<CommandModule>(fullPath).then(res =>
                res.map(module => createDispatcher({ module, event })),
            );
        },
    );
}

export function createMessageHandler(
    source: Observable<Message>,
    defaultPrefix: string,
    mg: ModuleManager,
) {
    return createGenericHandler(source, event => {
        const [prefix, ...rest] = fmt(event.content, defaultPrefix);
        const fullPath = mg.get(`${prefix}__A0`);
        if (fullPath === undefined) {
            return Err(SernError.UndefinedModule + ' No full path found in module store');
        }
        return defaultModuleLoader<CommandModule>(fullPath)
            .then(result => {
                const args = contextArgs(event, rest);
                return result.map(module => dispatchMessage(module, args))
            })
    });
}
/**
 * Creates a unique ID for a given interaction object.
 * @param event The interaction object for which to create an ID.
 * @returns A unique string ID based on the type and properties of the interaction object.
 */
function createId<T extends Interaction>(event: T) {
    switch (event.type) {
        case InteractionType.MessageComponent: {
            return `${event.customId}__C${event.componentType}`;
        }
        case InteractionType.ApplicationCommand:
        case InteractionType.ApplicationCommandAutocomplete: {
            return `${event.commandName}__A${event.commandType}`;
        }
        case InteractionType.ModalSubmit: {
            return `${event.customId}__C1`;
        }
    }
}



export function buildModules<T extends AnyModule>(
    input: ObservableInput<string>,
    sernEmitter: SernEmitter,
) {
    return pipe(
        switchMap(() => Files.buildModuleStream<T>(input)),
        errTap(error => {
            sernEmitter.emit('module.register', SernEmitter.failure(undefined, error));
        }),
        map(module => ({ module, absPath: module[sernMeta].fullPath })),
    );
}

function hasPrefix(prefix: string, content: string) {
    const prefixInContent = content.slice(0, prefix.length);
    return prefixInContent.localeCompare(prefix, undefined, { sensitivity: 'accent' }) === 0;
}

/**
 * Ignores messages from any person / bot except itself
 * @param prefix
 */
export function isNonBot(prefix: string) {
    return ({ author, content }: Message) => !author.bot && hasPrefix(prefix, content);
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
    emitter: SernEmitter,
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
            if (result.ok) {
                emitter.emit('module.activate', SernEmitter.success(module));
                return EMPTY;
            } else {
                return throwError(() => SernEmitter.failure(module, result.val));
            }
        }),
    );
}

/**
 * A higher order function that
 * - creates a stream of {@link VoidResult} { config.createStream }
 * - any failures results to { config.onFailure } being called
 * - if all results are ok, the stream is converted to { config.onSuccess }
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
                result.err && config.onStop?.(args.module);
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
export function callInitPlugins<
    T extends Processed<Module>,
    Args extends ImportPayload<T>,
>(config: { onStop?: (module: T) => unknown; onNext: (module: Args) => T }) {
    return concatMap(
        createResultResolver({
            createStream: args => from(args.module.plugins).pipe(callPlugin(args)),
            ...config,
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
    const onNext = ({ args, module }: Args) => ({ task: () => module.execute(...args), module });
    return concatMap(
        createResultResolver({
            onStop,
            createStream: ({ args, module }) => from(module.onEvent).pipe(callPlugin(args)),
            onNext,
        }),
    );
}


