import type Wrapper from './structures/wrapper';
import { onReady } from './events/readyEvent';
import { onMessageCreate } from './events/messageEvent';
import { onInteractionCreate } from './events/interactionCreate';
import { Err, Ok } from 'ts-results';
import { buildData } from './utilities/readFile';
import type { EventModule } from './structures/module';
import { from, fromEvent, map, throwError } from 'rxjs';
import { match } from 'ts-pattern';
import { errTap } from './events/observableHandling';
import { isDiscordEvent, isExternalEvent, isSernEvent } from './utilities/predicates';
import { SernError } from './structures/errors';
import type { SpreadParams } from '../types/handler';
import * as Files from './utilities/readFile';
import { basename } from 'path';

export function init(wrapper: Wrapper) {
    const { events } = wrapper;
    if (events !== undefined) {
        processEvents(wrapper, events);
    }
    onReady(wrapper);
    onMessageCreate(wrapper);
    onInteractionCreate(wrapper);
}

function processEvents(wrapper: Wrapper, events: string | EventModule[] | (() => EventModule[])) {
    const eventStream = eventObservable$(wrapper, events);
    const processPlugins$ = eventStream.pipe(map(mod => mod)); //for now, until i figure out what to do with how plugins are registered
    const normalize$ = processPlugins$.pipe(
        map(({ mod, absPath }) => {
            return {
                name: mod?.name ?? Files.fmtFileName(basename(absPath)),
                description: mod?.description ?? '...',
                ...mod,
            };
        }),
    );
    const processAndLoadEvents$ = normalize$.pipe(
        map(mod => {
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
                .when(isDiscordEvent, m =>
                    fromEvent(
                        wrapper.client,
                        mod.name!,
                        m.execute as SpreadParams<typeof m.execute>,
                    ),
                )
                .when(isExternalEvent, m => fromEvent(m.emitter, m.name!, m.execute))
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

export const controller = {
    next: () => Ok.EMPTY,
    stop: () => Err.EMPTY,
};
