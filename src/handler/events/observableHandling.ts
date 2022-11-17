import type { Message } from 'discord.js';
import { concatMap, from, Observable, of, tap, throwError } from 'rxjs';
import { SernError } from '../structures/errors';
import { Result } from 'ts-results-es';
import type { CommandType } from '../structures/enums';
import type Wrapper from '../structures/wrapper';
import { PayloadType } from '../structures/enums';
import type { CommandModule, CommandModuleDefs, Module } from '../../types/module';
import type { EventEmitter } from 'events';
import { _const } from '../utilities/functions';

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
export function errTap<T extends Module>(cb: (err: SernError) => void) {
    return (src: Observable<Result<{ mod: T; absPath: string }, SernError>>) =>
        new Observable<{ mod: T; absPath: string }>(subscriber => {
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
        mod: CommandModule;
        execute: () => unknown;
        res: Result<void, void>[];
    },
) {
    const emitter = wrapper.containerConfig.get('@sern/emitter')[0] as EventEmitter|undefined;
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
                        module: payload.mod,
                    }));
                }
                return of(res.val).pipe(
                    tap(() =>
                        emitter?.emit('module.activate', {
                            type: PayloadType.Success,
                            module: payload.mod,
                        }),
                    ),
                );
            }),
        );
    } else {
        emitter?.emit('module.activate', {
            type: PayloadType.Failure,
            module: payload.mod,
            reason: SernError.PluginFailure,
        });
        return of(undefined);
    }
}
