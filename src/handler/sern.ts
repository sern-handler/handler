import type { DiscordEvent, EventEmitterRegister, SernEvent } from '../types/handler';

import type Wrapper from './structures/wrapper';
import { from, fromEvent } from 'rxjs';
import { onReady } from './events/readyEvent';
import { onMessageCreate } from './events/messageEvent';
import { onInteractionCreate } from './events/interactionCreate';
import { Err, Ok } from 'ts-results';
import { isDiscordEvent, isSernEvent } from './utilities/predicates';
import type { Client } from 'discord.js';
import wrapper from './structures/wrapper';

export function init(wrapper: Wrapper) {
    const { events, client } = wrapper;
    if (events !== undefined) {
        eventObserver(wrapper, events);
    }
    onReady(wrapper);
    onMessageCreate(wrapper);
    onInteractionCreate(wrapper);
}

function eventObserver(
    { client, sernEmitter }: Wrapper,
    events: (DiscordEvent | EventEmitterRegister | SernEvent)[],
) {
    events.forEach(event => {
        if (isDiscordEvent(event)) {
            fromEvent(client, event[0], event[1]).subscribe();
        } else if (isSernEvent(event)) {
            sernEmitter && fromEvent(sernEmitter, event[0], event[1]).subscribe();
        } else {
            fromEvent(event[0], event[1], event[2]).subscribe();
        }
    });
}

export const controller = {
    next: () => Ok.EMPTY,
    stop: () => Err.EMPTY,
};
