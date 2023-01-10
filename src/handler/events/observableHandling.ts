import type { Awaitable, Message } from 'discord.js';
import { concatMap, EMPTY, from, Observable, of, tap, throwError } from 'rxjs';
import type { SernError } from '../structures/errors';
import { Result } from 'ts-results-es';
import type { AnyModule, Module } from '../../types/module';
import { _const as i } from '../utilities/functions';
import SernEmitter from '../sernEmitter';
import type { AnyDefinedModule } from '../../types/handler';
import { callPlugin$, everyPluginOk$, filterMapTo$ } from './operators';

export function ignoreNonBot<T extends Message>(prefix: string) {
    return (src: Observable<T>) => new Observable<T>(subscriber => {
          return src.subscribe({
              next(m) {
                  const messageFromHumanAndHasPrefix =
                      !m.author.bot &&
                      m.content
                          .slice(0, prefix.length)
                          .localeCompare(prefix, undefined, { sensitivity: 'accent' }) === 0;
                  if (messageFromHumanAndHasPrefix) {
                      subscriber.next(m);
                  }
              },
         });
    });
}

/**
 * If the current value in Result stream is an error, calls callback.
 * @param cb
 */
export function errTap<T extends AnyModule>(cb: (err: SernError) => void) {
    return (src: Observable<Result<{ module: T; absPath: string }, SernError>>) =>
        new Observable<{ module: T; absPath: string }>(subscriber => {
            return src.subscribe({
                next(value) {
                    if (value.err) {
                        cb(value.val);
                    } else {
                        subscriber.next(value.val);
                    }
                },
            });
        });
}

export function executeModule(
    emitter: SernEmitter,
    { module, task }: {
        module: Module;
        task: () => Awaitable<unknown>;
    },
) {
    return of(module).pipe(
        concatMap(() => Result.wrapAsync(async () => task())),
        concatMap(result => {
            if (result.ok) {
                emitter.emit('module.activate', SernEmitter.success(module));
                return EMPTY;
            } else {
                return throwError(i(SernEmitter.failure(module, result.val)));
            }
        }),
    );
}

/**
 * A higher order function that
 * - executes all plugins { config.createStream }
 * - any failures results to { config.onFailure } being called
 * - if all plugins are ok, the stream is converted to { config.onSuccess }
 * emit config.onSuccess Observable
 * @param config
 * @returns receiver function for flattening a stream of data
 */
export function createPluginResolver<
    T extends Module,
    Args extends { module: T; [key: string]: unknown },
    Output>(
    config: {
        onFailure?: (module: T) => unknown;
        onSuccess: (args: Args) => Output,
        createStream: (args: Args) => Observable<Result<void, void>>;
    }) {
    return (args: Args) => {
        const task = config.createStream(args);
        return task.pipe(
            tap(result => {
                if (result.err) {
                    config.onFailure?.(args.module);
                }
            }),
            everyPluginOk$,
            filterMapTo$(() => config.onSuccess(args)),
        );
    };
}

/**
 * Calls a module's init plugins and checks for Err. If so, call { onFailure } and
 * ignore the module
 */
export function scanModule<T extends AnyDefinedModule, Args extends { module: T, absPath: string }>(
    config : {
        onFailure?: (module: T) => unknown,
        onSuccess :(module: Args) => T
}) {
    return createPluginResolver({
        createStream: (args) => from(args.module.plugins).pipe(callPlugin$(args)),
        ...config
    });
}

/**
 * Creates an executable task ( execute the command ) if  all control plugins are successful
 * @param onFailure emits a failure response to the SernEmitter
 */
export function makeModuleExecutor<M extends Module, Args extends { module: M; args: any[] }>(
    onFailure: (m: M) => unknown,
) {
    const onSuccess = ({ args, module }: Args) => ({ task: () => module.execute(...args), module });
    return createPluginResolver({
        onFailure,
        createStream: ({ args, module }) => from(module.onEvent).pipe(callPlugin$(args)),
        onSuccess,
    });
}