import { CommandType } from '../structures/enums';
import { concatMap, from, fromEvent, map, of, throwError } from 'rxjs';
import { SernError } from '../structures/errors';
import * as Files from '../utilities/readFile';
import { buildData, ExternalEventEmitters } from '../utilities/readFile';
import { controller } from '../sern';
import type {
    DefinedEventModule,
    DefinedModule,
    Override,
    SpreadParams,
} from '../../types/handler';
import type { EventModule } from '../structures/module';
import type Wrapper from '../structures/wrapper';
import { basename } from 'path';
import { match, P } from 'ts-pattern';
import { isDiscordEvent, isExternalEvent, isSernEvent } from '../utilities/predicates';
import { errTap } from './observableHandling';
import type { CommandPlugin, Controller } from '../plugins/plugin';
import type { Awaitable, Client } from 'discord.js';
import type { Result } from 'ts-results';
import { Err, Ok } from 'ts-results';
/**
 * Utility function to process command plugins for all Modules
 * @param client
 * @param sernEmitter
 * @param mod
 * @param absPath
 */
export function processCommandPlugins$<T extends DefinedModule>(
    { client, sernEmitter }: Wrapper,
    mod: T,
) {
    return match(mod as DefinedModule)
        .with({ type: CommandType.External }, m =>
            Ok(
                m.plugins.map(plug => ({
                    ...plug,
                    name: plug?.name ?? 'Unnamed Plugin',
                    description: plug?.description ?? '...',
                    execute: plug.execute(ExternalEventEmitters.get(m.emitter)!, m, controller),
                })),
            ),
        )
        .with({ type: CommandType.Sern }, m =>
            Ok(
                m.plugins.map(plug => ({
                    ...plug,
                    name: plug?.name ?? 'Unnamed Plugin',
                    description: plug?.description ?? '...',
                    execute: plug.execute(sernEmitter!, m, controller),
                })),
            ),
        )
        .with(
            {
                type: P.not(CommandType.Autocomplete),
                plugins: P.array({} as P.infer<CommandPlugin>),
            },
            m =>
                Ok(
                    m.plugins.map(plug => ({
                        ...plug,
                        name: plug?.name ?? 'Unnamed Plugin',
                        description: plug?.description ?? '...',
                        execute: plug.execute(client, m, controller),
                    })),
                ),
        )
        .otherwise(() =>
            Err(
                throwError(
                    () =>
                        SernError.NonValidModuleType +
                        `. You cannot use command plugins and Autocomplete.`,
                ),
            ),
        );
}

export function processEvents(
    wrapper: Wrapper,
    events: string | EventModule[] | (() => EventModule[]),
) {
    const eventStream$ = eventObservable$(wrapper, events);
    const normalize$ = eventStream$.pipe(
        map(({ mod, absPath }) => {
            return <DefinedEventModule>{
                name: mod?.name ?? Files.fmtFileName(basename(absPath)),
                description: mod?.description ?? '...',
                ...mod,
            };
        }),
    );
    const processPlugins$ = normalize$.pipe(
        concatMap(mod => {
            const cmdPluginRes = processCommandPlugins$(wrapper, mod);
            if (cmdPluginRes.err) {
                return cmdPluginRes.val;
            }
            return of({ mod, cmdPluginRes: cmdPluginRes.val });
        }),
    );
    const processAndLoadEvents$ = processPlugins$.pipe(
        concatMap(({ mod, cmdPluginRes }) => {
            return match(mod as DefinedEventModule)
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
