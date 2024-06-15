import type { Interaction, Message, BaseInteraction } from 'discord.js';
import util from 'node:util';
import {
    EMPTY, type Observable, concatMap, filter,
    throwError, fromEvent, map, type OperatorFunction,
    catchError, finalize, pipe, from, take, share, of,
} from 'rxjs';
import * as Id from '../core/id'
import type { Emitter, ErrorHandling, Logging } from '../core/interfaces';
import { SernError } from '../core/structures/enums'
import { Err, Ok, Result } from 'ts-results-es';
import type { UnpackedDependencies } from '../types/utility';
import type { CommandModule, Module, Processed } from '../types/core-modules';
import * as assert from 'node:assert';
import { Context } from '../core/structures/context';
import { CommandType } from '../core/structures/enums'
import { inspect } from 'node:util'
import { disposeAll } from '../core/ioc';
import { resultPayload, isAutocomplete, treeSearch, fmt } from '../core/functions'
import merge from 'deepmerge'

function handleError<C>(crashHandler: ErrorHandling, emitter: Emitter, logging?: Logging) {
    return (pload: unknown, caught: Observable<C>) => {
        // This is done to fit the ErrorHandling contract
        if(!emitter.emit('error', pload)) {
            const err = pload instanceof Error ? pload : Error(util.inspect(pload, { colors: true }));
            logging?.error({ message: util.inspect(pload) });
            crashHandler.updateAlive(err);
        }
        return caught;
    };
}
const arrayify= <T>(src: T) => 
    Array.isArray(src) ? src : [src];

interface ExecutePayload {
    module: Module;
    args: unknown[];
    deps: Dependencies;
    params?: string;
    [key: string]: unknown
}

export const filterTap = <K, R>(onErr: (e: R) => void): OperatorFunction<Result<K, R>, K> => 
    concatMap(result => {
        if(result.isOk()) {
            return of(result.value)
        }
        onErr(result.error);
        return EMPTY;
    })

export const sharedEventStream = <T>(e: Emitter, eventName: string) => 
    (fromEvent(e, eventName) as Observable<T>).pipe(share());

function intoPayload(module: Module, deps: Dependencies) {
    return pipe(map(arrayify),
                map(args => ({ module, args, deps })),
                map(p => p.args));
}
/**
 * Creates an observable from { source }
 * @param module
 * @param source
 */
export function eventDispatcher(deps: Dependencies, module: Module, source: unknown) {
    assert.ok(source && typeof source === 'object',
              `${source} cannot be constructed into an event listener`);
    const execute: OperatorFunction<unknown[]|undefined, unknown> =
        concatMap(async args => {
            if(args) return Reflect.apply(module.execute, null, args);
        });

    //@ts-ignore
    let ev = fromEvent(source ,module.name!);
    //@ts-ignore
    if(module['once']) {
        ev = ev.pipe(take(1))
    }
    return ev.pipe(intoPayload(module, deps),
                   execute);
}

interface DispatchPayload { 
    module: Processed<CommandModule>;
    event: BaseInteraction; 
    defaultPrefix?: string;
    deps: Dependencies;
    params?: string
};
export function createDispatcher({ module, event, defaultPrefix, deps, params }: DispatchPayload): ExecutePayload {
    assert.ok(CommandType.Text !== module.type,
        SernError.MismatchEvent + 'Found text command in interaction stream');

    if(isAutocomplete(event)) {
        assert.ok(module.type === CommandType.Slash 
               || module.type === CommandType.Both, "Autocomplete option on non command interaction");
        const option = treeSearch(event, module.options);
        assert.ok(option, SernError.NotSupportedInteraction + ` There is no autocomplete tag for ` + inspect(module));
        const { command } = option;
        return { module: command as Processed<Module>, //autocomplete is not a true "module" warning cast!
                 args: [event],
                 deps };
    }
    switch (module.type) {
        case CommandType.Slash:
        case CommandType.Both: {
            return { module, args: [Context.wrap(event, defaultPrefix)], deps };
        }
        default: return { module, args: [event], deps, params };
    }
}
function createGenericHandler<Source, Narrowed extends Source, Output>(
    source: Observable<Source>,
    makeModule: (event: Narrowed) => Promise<Output>,
) {
    return (pred: (i: Source) => i is Narrowed) => 
        source.pipe(
            filter(pred), // only handle this stream if it passes pred
            concatMap(makeModule)); // create a payload, preparing to execute
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
    deps: Dependencies,
    defaultPrefix?: string
) {
    const mg = deps['@sern/modules'];
    return createGenericHandler<Interaction, T, Result<ReturnType<typeof createDispatcher>, void>>(
        source,
        async event => {
            const possibleIds = Id.reconstruct(event);
            let modules = possibleIds
                .map(({ id, params }) => ({ module: mg.get(id), params }))
                .filter(({ module }) => module !== undefined);
            if(modules.length == 0) {
                return Err.EMPTY;
            }
            const [{module, params}] = modules;
            return Ok(createDispatcher({ 
                module: module as Processed<CommandModule>, 
                event, defaultPrefix, deps, params 
            }));
    });
}

export function createMessageHandler(
    source: Observable<Message>,
    defaultPrefix: string,
    deps: Dependencies,
) {
    const mg = deps['@sern/modules'];
    return createGenericHandler(source, async event => {
        const [prefix] = fmt(event.content, defaultPrefix);
        let module= mg.get(`${prefix}_T`) ?? mg.get(`${prefix}_B`) as Module;
        if(!module) {
            return Err('Possibly undefined behavior: could not find a static id to resolve');
        }
        return Ok({ args: [Context.wrap(event, defaultPrefix)], module, deps })
    });
}


/**
 * Wraps the task in a Result as a try / catch.
 * if the task is ok, an event is emitted and the stream becomes empty
 * if the task is an error, throw an error down the stream which will be handled by catchError
 * thank u kingomes
 * @param emitter reference to SernEmitter that will emit a successful execution of module
 * @param module the module that will be executed with task
 * @param task the deferred execution which will be called
 */
export function executeModule(emitter: Emitter, { module, args }: ExecutePayload) {
    return from(Result.wrapAsync(async () => module.execute(...args)))
        .pipe(concatMap(result => { 
            if (result.isOk()) {
                emitter.emit('module.activate', resultPayload('success', module));
                return EMPTY;
            }
            return throwError(() => resultPayload('failure', module, result.error));
        }))
};

/**
 * A higher order function that
 * - calls all control plugins.
 * - any failures results to { config.onStop } being called
 * - if all results are ok, the stream is converted to { config.onNext }
 * config.onNext will be returned if everything is okay.
 * @param config
 * @returns function which calls all plugins and returns onNext or fail 
 */
export function createResultResolver<Output>(config: {
    onStop?: (module: Module, err?: string) => unknown;
    onNext: (args: ExecutePayload, map: Record<string, unknown>) => Output;
}) {
    const { onStop, onNext } = config;
    return async (payload: ExecutePayload) => {
        const task = await callPlugins(payload);
        if (!task) throw Error("Plugin did not return anything.");
        if(task.isOk()) {
            return onNext(payload, task.value) as Output;
        } else {
            onStop?.(payload.module, String(task.error));
        }
    };
};

function isObject(item: unknown) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

//_module is frozen, preventing from mutations
export async function callInitPlugins(_module: Module, deps: Dependencies, emit?: boolean) {
    let module = _module;
    const emitter = deps['@sern/emitter'];
    for(const plugin of module.plugins ?? []) {
        const result = await plugin.execute({ module, absPath: module.meta.absPath, deps });
        if (!result) throw Error("Plugin did not return anything. " + inspect(plugin, false, Infinity, true));
        if(result.isErr()) {
            if(emit) {
                emitter?.emit('module.register',
                              resultPayload('failure', module, result.error ?? SernError.PluginFailure));
            }
            throw Error(result.error ?? SernError.PluginFailure);
        }
    }
    return module
}

async function callPlugins({ args, module, deps, params }: ExecutePayload) {
    let state = {};
    for(const plugin of module.onEvent??[]) {
        const result = await plugin.execute(...args, { state, deps, params, type: module.type });
        if(result.isErr()) {
            return result;
        }
        if(isObject(result.value)) {
            state = merge(state, result.value!);
        }
    }
    return Ok(state);
}
/**
 * Creates an executable task ( execute the command ) if all control plugins are successful
 * @param onStop emits a failure response to the SernEmitter
 */
export function intoTask(onStop: (m: Module) => unknown) {
    const onNext = ({ args, module, deps, params }: ExecutePayload, state: Record<string, unknown>) => ({
        module,
        args: [...args, { state, deps, params, type: module.type }],
        deps
    });
    return createResultResolver({ onStop, onNext });
}

export const handleCrash = 
    ({ "@sern/errors": err, '@sern/emitter': sem, '@sern/logger': log } : UnpackedDependencies) => 
    pipe(catchError(handleError(err, sem, log)),
         finalize(() => {
            log?.info({ message: 'A stream closed or reached end of lifetime' });
            disposeAll(log);
         }))
