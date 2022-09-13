import { from, fromEvent, map } from 'rxjs';
import * as Files from '../utilities/readFile';
import { buildData, ExternalEventEmitters } from '../utilities/readFile';
import { controller } from '../sern';
import type {
    DefinedCommandModule,
    DefinedEventModule,
    EventInput,
    SpreadParams,
} from '../../types/handler';
import type { EventModule } from '../structures/module';
import { PayloadType } from '../structures/enums';
import type Wrapper from '../structures/wrapper';
import { basename } from 'path';
import { match } from 'ts-pattern';
import { isDiscordEvent, isSernEvent } from '../utilities/predicates';
import { errTap } from './observableHandling';

/**
 * Utility function to process command plugins for all Modules
 * @param wrapper
 * @param payload
 */
export function processCommandPlugins<T extends DefinedCommandModule>(
    wrapper: Wrapper,
    payload: { mod: T; absPath: string },
) {
    return (payload.mod.plugins || []).map(plug => ({
        ...plug,
        name: plug?.name ?? 'Unnamed Plugin',
        description: plug?.description ?? '...',
        execute: plug.execute(wrapper, payload, controller),
    }));
}

export function processEvents(wrapper: Wrapper, events: EventInput) {
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
            throw new Error(`Cannot find event emitter as it is undefined`);
        }
        //Would add sern event emitter for events loaded, attached onto sern emitter, but could lead to unwanted behavior!
        fromEvent(emitter, e.name, e.execute as SpreadParams<typeof e.execute>).subscribe();
    });
}

function eventObservable$({ sernEmitter }: Wrapper, events: EventInput) {
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
                            type: PayloadType.Failure,
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
