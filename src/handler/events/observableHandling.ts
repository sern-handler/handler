import type { Awaitable, Message } from 'discord.js';
import { concatMap, EMPTY, filter, from, Observable, of, pipe, tap, throwError } from 'rxjs';
import { Result } from 'ts-results-es';
import type { CommandModule, EventModule, Module } from '../../types/module';
import SernEmitter from '../sernEmitter';
import { callPlugin, everyPluginOk, filterMapTo } from './operators';
import type { Processed } from '../../types/handler';
import type { ControlPlugin, VoidResult } from '../../types/plugin';


function hasPrefix(prefix: string, content: string) {
    const prefixInContent = content.slice(0, prefix.length);
    return prefixInContent.localeCompare(prefix, undefined, { sensitivity: 'accent' }) === 0; 
}

/**
 * Ignores messages from any person / bot except itself
 * @param prefix
 */
export function ignoreNonBot(prefix: string) {
    const messageFromHumanAndHasPrefix = ({ author, content }: Message) => !author.bot && hasPrefix(prefix, content);
    return pipe(
       filter(messageFromHumanAndHasPrefix) 
    );
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
    onFailure?: (module: T) => unknown;
    onSuccess: (args: Args) => Output;
    createStream: (args: Args) => Observable<VoidResult>;
}) {
    return (args: Args) => {
        const task$ = config.createStream(args);
        return task$.pipe(
            tap(result => {
                if (result.err) {
                    config.onFailure?.(args.module);
                }
            }),
            everyPluginOk,
            filterMapTo(() => config.onSuccess(args)),
        );
    };
}

/**
 * Calls a module's init plugins and checks for Err. If so, call { onFailure } and
 * ignore the module
 */
export function callInitPlugins<
    T extends Processed<CommandModule | EventModule>,
    Args extends { module: T; absPath: string },
>(config: { onFailure?: (module: T) => unknown; onSuccess: (module: Args) => T }) {
    return pipe(
        concatMap(
            createResultResolver({
                createStream: args => from(args.module.plugins).pipe(callPlugin(args)),
                ...config,
            }),
        ),
    );
}

/**
 * Creates an executable task ( execute the command ) if  all control plugins are successful
 * @param onFailure emits a failure response to the SernEmitter
 */
export function makeModuleExecutor<
    M extends Processed<Module>,
    Args extends { module: M; args: unknown[] },
>(onFailure: (m: M) => unknown) {
    const onSuccess = ({ args, module }: Args) => ({ task: () => module.execute(...args), module });
    return pipe(
        concatMap(
            createResultResolver({
                onFailure,
                createStream: ({ args, module }) => from(module.onEvent).pipe(callPlugin(args)),
                onSuccess,
            }),
        ),
    );
}
