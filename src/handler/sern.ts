import type Wrapper from './structures/wrapper';
import { onReady } from './events/readyEvent';
import { onMessageCreate } from './events/messageEvent';
import { onInteractionCreate } from './events/interactionCreate';
import { Err, Ok } from 'ts-results';
import { ExternalEventEmitters } from './utilities/readFile';
import type { EventEmitter } from 'events';
import { processEvents } from './events/userDefinedEventsHandling';

/**
 *
 * @param wrapper options to pass into sern.
 *  Function to start the handler up.
 */
export function init(wrapper: Wrapper) {
    const { events } = wrapper;
    if (events !== undefined) {
        processEvents(wrapper, events);
    }
    onReady(wrapper);
    onMessageCreate(wrapper);
    onInteractionCreate(wrapper);
}

/**
 *
 * @param emitter Any external event emitter.
 * The object will be stored in a map, and then fetched by the name of the emitter provided.
 * As there are infinite possibilities to adding external event emitters,
 * Most types arent provided and are as narrow as possibly can.
 */
export function addExternal<T extends EventEmitter>(emitter: T) {
    if (ExternalEventEmitters.has(emitter.constructor.name)) {
        throw Error(`${emitter.constructor.name} already exists!`);
    }
    ExternalEventEmitters.set(emitter.constructor.name, emitter);
}

export const controller = {
    next: () => Ok.EMPTY,
    stop: () => Err.EMPTY,
};
