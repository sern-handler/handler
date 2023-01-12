import { CommandType, EventType, PluginType } from '../structures/enums';
import type { Plugin, PluginResult } from './plugin';
import type { CommandArgs, EventArgs } from './args';
import type { ClientEvents } from 'discord.js';

export function makePlugin<V extends unknown[]>(
    type: PluginType,
    execute: (...args: any[]) => any,
): Plugin<V> {
    return {
        type,
        execute,
    };
}

export function EventInitPlugin<I extends EventType>(
    execute: (...args: EventArgs<I, PluginType.Init>) => PluginResult,
) {
    return makePlugin(PluginType.Init, execute);
}

export function CommandInitPlugin<I extends CommandType>(
    execute: (...args: CommandArgs<I, PluginType.Init>) => PluginResult,
) {
    return makePlugin(PluginType.Init, execute);
}

export function CommandControlPlugin<I extends CommandType>(
    execute: (...args: CommandArgs<I, PluginType.Control>) => PluginResult,
) {
    return makePlugin(PluginType.Control, execute);
}

export function EventControlPlugin<I extends EventType>(
    execute: (...args: EventArgs<I, PluginType.Control>) => PluginResult,
) {
    return makePlugin(PluginType.Control, execute);
}

/**
 * @Experimental
 * A specialized function for creating control plugins with discord.js ClientEvents.
 * Will probably be moved one day!
 */
export function DiscordEventControlPlugin<T extends keyof ClientEvents>(
    name: T,
    execute: (...args: ClientEvents[T]) => PluginResult,
) {
    return makePlugin(PluginType.Control, execute);
}
