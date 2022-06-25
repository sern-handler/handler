import { from, fromEvent, map } from 'rxjs';
import * as Files from '../utilities/readFile';
import { buildData, ExternalEventEmitters } from '../utilities/readFile';
import { controller } from '../sern';
import type { DefinedCommandModule, DefinedEventModule, SpreadParams } from '../../types/handler';
import type { EventModule } from '../structures/module';
import type Wrapper from '../structures/wrapper';
import { basename } from 'path';
import { match, P } from 'ts-pattern';
import { isDiscordEvent, isSernEvent } from '../utilities/predicates';
import { errTap } from './observableHandling';

/**
 * Utility function to process command plugins for all Modules
 * @param client
 * @param mod
 */
export function processCommandPlugins<T extends DefinedCommandModule>({ client }: Wrapper, mod: T) {
    return mod.plugins.map(plug => ({
        ...plug,
        name: plug?.name ?? 'Unnamed Plugin',
        description: plug?.description ?? '...',
        execute: plug.execute(client, mod, controller),
    }));
}

export function processEvents(
    wrapper: Wrapper,
    events:
        | string
        | { mod: EventModule; absPath: string }[]
        | (() => { mod: EventModule; absPath: string }[]),
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
    normalize$.subscribe(e => {
        const emitter = isSernEvent(e)
            ? wrapper?.sernEmitter
            : isDiscordEvent(e)
            ? wrapper.client
            : ExternalEventEmitters.get(e.emitter);
        if (emitter === undefined) {
            throw new Error(`Cannot find ${emitter}`);
        }
        fromEvent(emitter, e.name, e.execute as SpreadParams<typeof e.execute>).subscribe();
    });

    // TODO
    // const processPlugins$ = normalize$.pipe(
    //     concatMap(mod => {
    //         const cmdPluginRes = processCommandPlugins$(wrapper, mod);
    //         if (cmdPluginRes.err) {
    //             return cmdPluginRes.val;
    //         }
    //
    //         return of({ mod, cmdPluginRes });
    //     }),
    // );
    // const processAndLoadEvents$ = processPlugins$.pipe(
    //     concatMap(async ({ mod, cmdPluginRes }) => {
    //         return {
    //             mod,
    //             cmdPluginRes,
    //             eventLoaded: match(mod as DefinedEventModule)
    //                 .when(isSernEvent, m => {
    //                     if (wrapper.sernEmitter === undefined) {
    //                         return throwError(() => SernError.UndefinedSernEmitter);
    //                     }
    //                     return fromEvent(
    //                         wrapper.sernEmitter,
    //                         m.name!,
    //                         m.execute as SpreadParams<typeof m.execute>,
    //                     ).pipe(
    //                         concatMap(event => {
    //                             return of(
    //                                 m.onEvent.map(plug => ({
    //                                     ...plug,
    //                                     name: plug?.name ?? 'Unnamed Plugin',
    //                                     description: plug?.description ?? '..',
    //                                     execute: plug.execute(
    //                                         [event] as [string | Error] | [Payload],
    //                                         controller,
    //                                     ),
    //                                 })),
    //                             );
    //                         }),
    //                     );
    //                 })
    //                 .when(isDiscordEvent, m => {
    //                     return fromEvent(
    //                         wrapper.client,
    //                         m.name!,
    //                         m.execute as SpreadParams<typeof m.execute>,
    //                     ).pipe(
    //                         concatMap(event => {
    //                             return of(
    //                                 m.onEvent.map(plug => ({
    //                                     ...plug,
    //                                     name: plug?.name ?? 'Unnamed Plugin',
    //                                     description: plug?.description ?? '..',
    //                                     execute: plug.execute(
    //                                         [event] as ClientEvents[keyof ClientEvents],
    //                                         controller,
    //                                     ),
    //                                 })),
    //                             );
    //                         }),
    //                     );
    //                 })
    //                 .when(isExternalEvent, m => {
    //                     if (!ExternalEventEmitters.has(m.emitter)) {
    //                         throw Error(
    //                             SernError.UndefinedSernEmitter +
    //                                 `Could not locate
    //                     a dependency ${m.emitter} to call this event listener`,
    //                         );
    //                     }
    //                     return fromEvent(
    //                         ExternalEventEmitters.get(m.emitter)!,
    //                         m.name!,
    //                         m.execute,
    //                     ).pipe(
    //                         concatMap(event => {
    //                             return of(
    //                                 m.onEvent.map(plug => ({
    //                                     ...plug,
    //                                     name: plug?.name ?? 'Unnamed Plugin',
    //                                     description: plug?.description ?? '..',
    //                                     execute: plug.execute([event], controller),
    //                                 })),
    //                             );
    //                         }),
    //                     );
    //                 })
    //                 .run(),
    //         };
    //     }),
    // );
    // // Cannot send to Sern's emitter because it hasn't been turned on yet. Don't know if
    // // this will be changed.
    // processAndLoadEvents$.subscribe({
    //     async next({ cmdPluginRes, eventLoaded, mod }) {
    //         for (const pl of cmdPluginRes) {
    //             const res = isPromise(pl.execute) ? await pl.execute : pl.execute;
    //             if (res.err) {
    //                 throw Error(
    //                     'Could not load an event module correctly, a plugin called controller.stop()',
    //                 );
    //             }
    //         }
    //         eventLoaded.subscribe();
    //     },
    //     error(e) {
    //         wrapper.sernEmitter?.emit('error', e);
    //     },
    // });
}

function eventObservable$(
    { sernEmitter }: Wrapper,
    events:
        | string
        | { mod: EventModule; absPath: string }[]
        | (() => { mod: EventModule; absPath: string }[]),
) {
    return match(events)
        .when(Array.isArray, (arr: { mod: EventModule; absPath: string }[]) => {
            return from(arr);
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
            (evs: () => { mod: EventModule; absPath: string }[]) => {
                return from(evs());
            },
        )
        .run();
}
