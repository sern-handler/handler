import type { Message } from 'discord.js';
import { concatMap, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { SernError } from '../structures/errors';
import { Result } from 'ts-results-es';
import type { CommandType } from '../structures/enums';
import { PayloadType } from '../structures/enums';
import type { AnyModule, CommandModule, CommandModuleDefs, EventModule, Module } from '../../types/module';
import { _const, isEmpty, nameOrFilename } from '../utilities/functions';
import type SernEmitter from '../sernEmitter';
import type { AnyDefinedModule, DefinedCommandModule, DefinedEventModule } from '../../types/handler';
import { processCommandPlugins } from './userDefinedEventsHandling';
import type { PluginResult } from '../plugins';

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
    emitter: SernEmitter,
    payload: {
        module: Module;
        execute: () => unknown;
        res: Result<void, void>[];
    },
) {
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

/**
 * Plugins are successful if all results are ok.
 * Reduces initResult into a single boolean
 * @param src
 */
export function resolveInitPlugins$<T extends AnyDefinedModule>(
    src: Observable<{ module: T, initResult: PluginResult[], }>,
) {
    return src.pipe(
        concatMap(({ module, initResult }) => {
            if (isEmpty(initResult))
                return of({ module, success: true });
            else
                return from(Promise.all(initResult)).pipe(
                    reduceResults$,
                    map(success => ({ module, success })),
                );
        }),
    );
}

export function processPlugins<T extends AnyDefinedModule>(payload: {
    module: T;
    absPath: string;
}) {
    const initResult = processCommandPlugins(payload);
    return of({ module: payload.module, initResult });
}

/**
 * fills the defaults for modules
 * signature : Observable<{ absPath: string; module: CommandModule | EventModule }> -> Observable<{ absPath: string; module: Processed<CommandModule | EventModule> }>
 */
export function defineAllFields$<T extends AnyModule>(
    src: Observable<{ absPath: string; module: T }>,
) {
    const fillFields = ({ absPath, module }: { absPath: string; module: T }) => ({
        absPath,
        module: {
            name: nameOrFilename(module.name, absPath),
            description: module.description ?? '...',
            ...module,
        },
    });
    return src.pipe(
        map(fillFields),
    );
}

/**
 * Reduces a stream of results into a single boolean value
 * possible refactor in future to lazily check?
 * @param src
 */
export function reduceResults$(src: Observable<Result<void, void>[]>): Observable<boolean> {
    return src.pipe(switchMap(s => of(s.every(a => a.ok))));
}