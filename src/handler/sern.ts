import type { DiscordEvent, EventEmitterRegister } from '../types/handler';

import type Wrapper from './structures/wrapper';
import { fromEvent } from 'rxjs';
import { onReady } from './events/readyEvent';
import { onMessageCreate } from './events/messageEvent';
import { onInteractionCreate } from './events/interactionCreate';
import { Err, Ok } from 'ts-results';
import { isDiscordEvent } from './utilities/predicates';
import type { Client } from 'discord.js';

export function init(wrapper: Wrapper) {
    const { events, client } = wrapper;
    if (events !== undefined) {
        eventObserver(client, events);
    }
    onReady(wrapper);
    onMessageCreate(wrapper);
    onInteractionCreate(wrapper);
}

function eventObserver(client: Client, events: (DiscordEvent | EventEmitterRegister)[]) {
    events.forEach(event => {
        if (isDiscordEvent(event)) {
            fromEvent(client, event[0], event[1]).subscribe();
        } else {
            fromEvent(event[0], event[1], event[2]).subscribe();
        }
    });
}

export const controller = {
    next: () => Ok.EMPTY,
    stop: () => Err.EMPTY,
};
