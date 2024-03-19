import { ClientEvents } from 'discord.js';
import { EventType } from '../core/structures';
import type {
    AnyEventPlugin,
} from '../types/core-plugin';
import type {
    CommandModule,
    EventModule,
    InputCommand,
    InputEvent,
} from '../types/core-modules';
import { partitionPlugins } from './_internal';
import type { Awaitable } from '../types/utility';

/**
 * @since 1.0.0 The wrapper function to define command modules for sern
 * @param mod
 */
export function commandModule(mod: InputCommand): CommandModule {
    const [onEvent, plugins] = partitionPlugins(mod.plugins);
    return {
        ...mod,
        onEvent,
        plugins,
    } as CommandModule;
}
/**
 * @since 1.0.0
 * The wrapper function to define event modules for sern
 * @param mod
 */
export function eventModule(mod: InputEvent): EventModule {
    const [onEvent, plugins] = partitionPlugins(mod.plugins);
    return {
        ...mod,
        plugins,
        onEvent,
    } as EventModule;
}

/** Create event modules from discord.js client events,
 * This is an {@link eventModule} for discord events,
 * where typings can be very bad.
 * @Experimental
 * @param mod
 */
export function discordEvent<T extends keyof ClientEvents>(mod: {
    name: T;
    plugins?: AnyEventPlugin[];
    execute: (...args: ClientEvents[T]) => Awaitable<unknown>;
}) {
    return eventModule({
        type: EventType.Discord,
        ...mod,
    });
}

