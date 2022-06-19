import { CommandType } from '../structures/enums';
import { concatMap, from, fromEvent, map, of, throwError } from 'rxjs';
import { SernError } from '../structures/errors';
import { buildData, ExternalEventEmitters } from '../utilities/readFile';
import { controller } from '../sern';
import type { DefinedModule, DefinitelyDefined } from '../../types/handler';
import type { Module } from '../structures/module';
import type Wrapper from '../structures/wrapper';
import type { EventModule } from '../structures/module';
import * as Files from '../utilities/readFile';
import { basename } from 'path';
import { match } from 'ts-pattern';
import { isDiscordEvent, isExternalEvent, isSernEvent } from '../utilities/predicates';
import type { SpreadParams } from '../../types/handler';
import { errTap } from './observableHandling';

export function processCommandPlugins$<T extends DefinedModule>(
    { client, sernEmitter }: Wrapper,
    { mod, absPath }: { mod: T; absPath: string },
) {
    if (mod.type === CommandType.Autocomplete) {
        return throwError(
            () =>
                SernError.NonValidModuleType + `. You cannot use command plugins and Autocomplete.`,
        );
    }
    if (mod.type === CommandType.External) {
        mod.plugins.map(plug => ({
            ...plug,
            name: plug?.name ?? 'Unnamed Plugin',
            description: plug?.description ?? '...',
            execute: plug.execute(ExternalEventEmitters.get(mod.emitter)!, mod, controller),
        }));
    }
    if (mod.type === CommandType.Sern) {
        mod.plugins.map(plug => ({
            ...plug,
            name: plug?.name ?? 'Unnamed Plugin',
            description: plug?.description ?? '...',
            execute: plug.execute(sernEmitter!, mod, controller),
        }));
    }
}

export function processEvents(
    wrapper: Wrapper,
    events: string | EventModule[] | (() => EventModule[]),
) {
    const eventStream$ = eventObservable$(wrapper, events);
    const normalize$ = eventStream$.pipe(
        map(({ mod, absPath }) => {
            return {
                name: mod?.name ?? Files.fmtFileName(basename(absPath)),
                description: mod?.description ?? '...',
                ...mod,
            };
        }),
    );
    const processPlugins$ = normalize$.pipe(map(mod => mod)); //for now, until i figure out what to do with how plugins are registered

    const processAndLoadEvents$ = processPlugins$.pipe(
        concatMap(mod => {
            return match(mod as EventModule)
                .when(isSernEvent, m => {
                    if (wrapper.sernEmitter === undefined) {
                        return throwError(() => SernError.UndefinedSernEmitter);
                    }
                    return fromEvent(
                        wrapper.sernEmitter,
                        m.name!,
                        m.execute as SpreadParams<typeof m.execute>,
                    );
                })
                .when(isDiscordEvent, m => {
                    return fromEvent(
                        wrapper.client,
                        m.name!,
                        m.execute as SpreadParams<typeof m.execute>,
                    );
                })
                .when(isExternalEvent, m => {
                    if (!ExternalEventEmitters.has(m.emitter)) {
                        throw Error(
                            SernError.UndefinedSernEmitter +
                                `Could not locate 
                        a dependency ${m.emitter} to call this event listener`,
                        );
                    }
                    return fromEvent(ExternalEventEmitters.get(m.emitter)!, m.name!, m.execute);
                })
                .run();
        }),
    );
}

function eventObservable$(
    { sernEmitter }: Wrapper,
    events: string | EventModule[] | (() => EventModule[]),
) {
    return match(events)
        .when(Array.isArray, (arr: EventModule[]) => {
            return from(arr.map(self => ({ mod: self, absPath: __filename })));
        })
        .when(
            e => typeof e === 'string',
            (eventsDir: string) => {
                return buildData<EventModule>(eventsDir).pipe(
                    errTap(reason =>
                        sernEmitter?.emit('module.register', {
                            type: 'failure',
                            module: undefined,
                            reason,
                        }),
                    ),
                );
            },
        )
        .when(
            e => typeof e === 'function',
            (evs: () => EventModule[]) => {
                return from(evs().map(self => ({ mod: self, absPath: __filename })));
            },
        )
        .run();
}
