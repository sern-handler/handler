import { from, fromEvent, map } from 'rxjs';
import * as Files from '../utilities/readFile';
import { buildData, ExternalEventEmitters } from '../utilities/readFile';
import { controller } from '../sern';
import type { DefinedCommandModule, DefinedEventModule, SpreadParams } from '../../types/handler';
import type { EventModule } from '../structures/module';
import type Wrapper from '../structures/wrapper';
import { basename } from 'path';
import { match } from 'ts-pattern';
import { isDiscordEvent, isSernEvent } from '../utilities/predicates';
import { errTap } from './observableHandling';

/**
 * Utility function to process command plugins for all Modules
 * @param wrapper
 * @param mod
 */
export function processCommandPlugins<T extends DefinedCommandModule>(wrapper: Wrapper, mod: T) {
    return mod.plugins.map(plug => ({
        ...plug,
        name: plug?.name ?? 'Unnamed Plugin',
        description: plug?.description ?? '...',
        execute: plug.execute(wrapper, mod, controller),
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
            throw new Error(`Cannot find event emitter as it is undefined`);
        }
        fromEvent(emitter, e.name, e.execute as SpreadParams<typeof e.execute>).subscribe();
    });
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
