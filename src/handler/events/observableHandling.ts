import type { Message } from 'discord.js';
import { concatMap, from, map, Observable, of, switchMap, tap, throwError, toArray } from 'rxjs';
import { SernError } from '../structures/errors';
import { Result } from 'ts-results-es';
import type { CommandType } from '../structures/enums';
import type Wrapper from '../structures/wrapper';
import { PayloadType, PluginType } from '../structures/enums';
import type { CommandModule, CommandModuleDefs, AnyModule, Module } from '../../types/module';
import { _const } from '../utilities/functions';
import type SernEmitter from '../sernEmitter';
import type { DefinedCommandModule, DefinedEventModule } from '../../types/handler';
import type { Awaitable } from 'discord.js';
import { processCommandPlugins } from './userDefinedEventsHandling';

export function ignoreNonBot(prefix: string) {
    return (src: Observable<Message>) =>
        new Observable<Message>(subscriber => {
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
                error: e => subscriber.error(e),
                complete: () => subscriber.complete(),
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
                error: e => subscriber.error(e),
                complete: () => subscriber.complete(),
            });
        });
}

//POG
export function isOneOfCorrectModules<T extends readonly CommandType[]>(...inputs: [...T]) {
    return (src: Observable<CommandModule | undefined>) => {
        return new Observable<CommandModuleDefs[T[number]]>(subscriber => {
            return src.subscribe({
                next(mod) {
                    if (mod === undefined) {
                        return throwError(_const(SernError.UndefinedModule));
                    }
                    if (inputs.some(type => (mod.type & type) !== 0)) {
                        subscriber.next(mod as CommandModuleDefs[T[number]]);
                    } else {
                        return throwError(_const(SernError.MismatchModule));
                    }
                },
                error: e => subscriber.error(e),
                complete: () => subscriber.complete(),
            });
        });
    };
}

export function executeModule(
    wrapper: Wrapper,
    payload: {
        module: Module;
        execute: () => unknown;
        res: Result<void, void>[];
    },
) {
    const emitter = wrapper.containerConfig.get('@sern/emitter')[0] as SernEmitter;
    if (payload.res.every(el => el.ok)) {
        const executeFn = Result.wrapAsync<unknown, Error | string>(() =>
            Promise.resolve(payload.execute()),
        );
        return from(executeFn).pipe(
            concatMap(res => {
                if (res.err) {
                    return throwError(() => ({
                        type: PayloadType.Failure,
                        reason: res.val,
                        module: payload.module,
                    }));
                }
                return of(res.val).pipe(
                    tap(() =>
                        emitter.emit('module.activate', {
                            type: PayloadType.Success,
                            module: payload.module as AnyModule,
                        }),
                    ),
                );
            }),
        );
    } else {
        emitter.emit('module.activate', {
            type: PayloadType.Failure,
            module: payload.module as AnyModule,
            reason: SernError.PluginFailure,
        });
        return of(undefined);
    }
}

export function resolvePlugins({
    module,
    cmdPluginRes,
}: {
    module: DefinedCommandModule | DefinedEventModule;
    cmdPluginRes: {
        execute: Awaitable<Result<void, void>>;
        type: PluginType.Init;
    }[];
}) {
    if (module.plugins.length === 0) {
        return of({ module, pluginRes: [] });
    }
    // modules with no event plugins are ignored in the previous
    return from(cmdPluginRes).pipe(
        switchMap(pl =>
            from(pl.execute).pipe(
                map(execute => ({ ...pl, execute })),
                toArray(),
            ),
        ),
        map(pluginRes => ({ module, pluginRes })),
    );
}

export function processPlugins<T extends DefinedCommandModule | DefinedEventModule>(payload: {
    module: T;
    absPath: string;
}) {
    const cmdPluginRes = processCommandPlugins(payload);
    return of({ module: payload.module, cmdPluginRes });
}
