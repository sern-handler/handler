import type { Interaction, Message, BaseInteraction } from 'discord.js';
import {
    EMPTY,
    Observable,
    concatMap,
    filter,
    from,
    of,
    throwError,
    tap,
    fromEvent, map, OperatorFunction,
    catchError,
    finalize,
    pipe
} from 'rxjs';
import {
    callPlugin,
    everyPluginOk,
    filterMapTo,
    handleError,
    type VoidResult,
    resultPayload,
    arrayifySource,
    isAutocomplete,
    treeSearch,
    _Module,
} from '../core/_internal';
import * as Id from '../core/id'
import type { Emitter, ErrorHandling, Logging } from '../core/interfaces';
import { PayloadType, SernError } from '../core/structures/enums'
import { Err, Ok, Result } from 'ts-results-es';
import type { Awaitable } from '../types/utility';
import type { ControlPlugin } from '../types/core-plugin';
import type { CommandMeta, CommandModule, Module, Processed } from '../types/core-modules';
import { EventEmitter } from 'node:events';
import * as assert from 'node:assert';
import { Context } from '../core/structures/context';
import { CommandType } from '../core/structures/enums'
import type { Args } from '../types/utility';
import { inspect } from 'node:util'
import { disposeAll } from '../core/ioc/base';


function contextArgs(wrappable: Message | BaseInteraction, messageArgs?: string[]) {
    const ctx = Context.wrap(wrappable);
    const args = ctx.isMessage() ? ['text', messageArgs!] : ['slash', ctx.options];
    return [ctx, args] as [Context, Args];
}


function intoPayload(module: Processed<Module>, ) {
    return pipe(map(arrayifySource),
                map(args => ({ module, args })));
}

const createResult = createResultResolver<
    Processed<Module>,
    { module: Processed<Module>; args: unknown[]  },
    unknown[]
>({
    createStream: ({ module, args }) => from(module.onEvent).pipe(callPlugin(args)),
    onNext: ({ args }) => args,
});
/**
 * Creates an observable from { source }
 * @param module
 * @param source
 */
export function eventDispatcher(module: Processed<Module>,  source: unknown) {
    assert.ok(source instanceof EventEmitter, `${source} is not an EventEmitter`);

    const execute: OperatorFunction<unknown[], unknown> =
        concatMap(async args => module.execute(...args));
    return fromEvent(source, module.name)
        .pipe(intoPayload(module),
              concatMap(createResult),
              execute);
}

export function createDispatcher(payload: { module: Processed<CommandModule>; event: BaseInteraction; }) {
    assert.ok(CommandType.Text !== payload.module.type,
        SernError.MismatchEvent + 'Found text command in interaction stream');
    switch (payload.module.type) {
        case CommandType.Slash:
        case CommandType.Both: {
            if (isAutocomplete(payload.event)) {
                const option = treeSearch(payload.event, payload.module.options);
                assert.ok(option, SernError.NotSupportedInteraction + ` There is no autocomplete tag for ` + inspect(payload.module));
                const { command } = option;
            
             	return {
             	    module: command as Processed<Module>, //autocomplete is not a true "module" warning cast!
             	    args: [payload.event],
             	};
            }
            return { module: payload.module, args: contextArgs(payload.event) };
        }
        default: return { module: payload.module, args: [payload.event] };
    }
}
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
    mg: Map<string, _Module>, //TODO
) {
    return createGenericHandler<Interaction, T, Result<ReturnType<typeof createDispatcher>, void>>(
        source,
        async event => {
            const possibleIds = Id.reconstruct(event);
            let fullPaths= possibleIds
                .map(id => mg.get(id))
                .filter((id): id is _Module => id !== undefined);

            if(fullPaths.length == 0) {
                return Err.EMPTY;
            }
            const [ path ] = fullPaths;
            //@ts-ignore TODO fixme
            return Ok(createDispatcher({ module: path as Processed<CommandModule>, event }));
    });
}

export function createMessageHandler(
    source: Observable<Message>,
    defaultPrefix: string,
    mg: any,
) {
    return createGenericHandler(source, async event => {
        const [prefix, ...rest] = fmt(event.content, defaultPrefix);
        let fullPath = mg.get(`${prefix}_T`);
        if(!fullPath) {
            fullPath = mg.get(`${prefix}_B`);
            if(!fullPath) {
                return Err('Possibly undefined behavior: could not find a static id to resolve');
            }
        }
        return Ok({ args: contextArgs(event, rest), module: fullPath as Processed<CommandModule>  })
    });
}



interface ExecutePayload {
    module: Processed<Module>;
    task: () => Awaitable<unknown>;
    args: unknown[]
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
    logger: Logging|undefined,
    errHandler: ErrorHandling,
    { module, task, args }: ExecutePayload,
) {
    return of(module).pipe(
        //converting the task into a promise so rxjs can resolve the Awaitable properly
        concatMap(() => Result.wrapAsync(async () => task())),
        concatMap(result => {
            if (result.isOk()) {
                emitter.emit('module.activate', resultPayload(PayloadType.Success, module));
                return EMPTY;
            } 
            return throwError(() => resultPayload(PayloadType.Failure, module, result.error));
            
        }),
    );
};


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
};

/**
 * Calls a module's init plugins and checks for Err. If so, call { onStop } and
 * ignore the module
 */
export function callInitPlugins<T extends Processed<Module>>(sernEmitter: Emitter) {
    return concatMap(
        createResultResolver({
            createStream: args => from(args.module.plugins).pipe(callPlugin(args)),
            onStop: (module: T) => {
                sernEmitter.emit('module.register', resultPayload(PayloadType.Failure, module, SernError.PluginFailure));
            },
            onNext: (payload) => {
                sernEmitter.emit('module.register', resultPayload(PayloadType.Success, payload.module));
                return payload as { module: T; metadata: CommandMeta };
            },
        }),
    );
}

/**
 * Creates an executable task ( execute the command ) if all control plugins are successful
 * @param onStop emits a failure response to the SernEmitter
 */
export function makeModuleExecutor<
    M extends Processed<Module>,
    Args extends { module: M; args: unknown[]; }>
(onStop: (m: M) => unknown) {
    const onNext = ({ args, module }: Args) => ({
        task: () => module.execute(...args),
        module,
        args
    });
    return createResultResolver({
            onStop,
            createStream: ({ args, module }) => 
                from(module.onEvent)
                    .pipe(callPlugin(args)),
            onNext,
        })
}

export const handleCrash = (err: ErrorHandling,sernemitter: Emitter, log?: Logging) =>
    pipe(
        catchError(handleError(err, sernemitter, log)),
        finalize(() => {
            log?.info({
                message: 'A stream closed or reached end of lifetime',
            });
            disposeAll(log);
        }));
