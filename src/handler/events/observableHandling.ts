import type { Message } from 'discord.js';
import { from, Observable, of, tap, throwError } from 'rxjs';
import { SernError } from '../structures/errors';
import type { Module, CommandModuleDefs, CommandModule } from '../structures/module';
import type { Result } from 'ts-results-es';
import type { CommandType } from '../structures/enums';
import type Wrapper from '../structures/wrapper';
import { PayloadType } from '../structures/enums';


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
                        return throwError(() => SernError.UndefinedModule);
                    }
                    if (inputs.some(type => (mod.type & type) !== 0)) {
                        subscriber.next(mod as CommandModuleDefs[T[number]]);
                    } else {
                        return throwError(() => SernError.MismatchModule);
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
    if (payload.res.every(el => el.ok)) {
        return from(Promise.resolve(payload.execute())).pipe(
            tap(() => {
                wrapper.sernEmitter?.emit('module.activate', {
                    type: PayloadType.Success,
                    module: payload.mod,
                });
            }),
        );
    } else {
        wrapper.sernEmitter?.emit('module.activate', {
            type: PayloadType.Failure,
            module: payload.mod,
            reason: SernError.PluginFailure,
        });
        return of(null);
    }
}
