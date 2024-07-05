import type { ClientEvents } from 'discord.js';
import { EventType } from '../core/structures/enums';
import type {
    InputCommand,
    InputEvent,
    Module,
    ScheduledTask,
} from '../types/core-modules';
import { partitionPlugins } from './functions'
import type { Awaitable } from '../types/utility';

/**
 * @since 1.0.0 The wrapper function to define command modules for sern
 * @param mod
 */
export function commandModule(mod: InputCommand): Module {
    const [onEvent, plugins] = partitionPlugins(mod.plugins);
    return { ...mod,
             onEvent,
             plugins,
             locals: {} } as Module;
}

/**
 * @since 1.0.0
 * The wrapper function to define event modules for sern
 * @param mod
 */
export function eventModule(mod: InputEvent): Module {
    const [onEvent, plugins] = partitionPlugins(mod.plugins);
    if(onEvent.length !== 0) throw Error("Event modules cannot have ControlPlugins");
    return { ...mod,
             plugins,
             locals: {} } as Module;
}

/** Create event modules from discord.js client events,
 * This is an {@link eventModule} for discord events,
 * where typings can be very bad.
 * @Experimental
 * @param mod
 */
export function discordEvent<T extends keyof ClientEvents>(mod: {
    name: T;
    execute: (...args: ClientEvents[T]) => Awaitable<unknown>;
}) {
    return eventModule({ type: EventType.Discord, ...mod, });
}


export function scheduledTask(i : ScheduledTask) {
    return i 
}

