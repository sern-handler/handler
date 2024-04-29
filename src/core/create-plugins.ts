import { CommandType, EventType, PluginType } from './structures';
import type { Plugin, PluginResult, EventArgs, CommandArgs } from '../types/core-plugin';
import type { ClientEvents } from 'discord.js';
import { err, ok } from './functions';

export function makePlugin<V extends unknown[]>(
    type: PluginType,
    execute: (...args: any[]) => any,
): Plugin<V> {
    return { type, execute, } as Plugin<V>;
}
/**
 * @since 2.5.0
 */
export function EventInitPlugin<I extends EventType>(
    execute: (...args: EventArgs<I, PluginType.Init>) => PluginResult,
) {
    return makePlugin(PluginType.Init, execute);
}
/**
 * @since 2.5.0
 */
export function CommandInitPlugin<I extends CommandType>(
    execute: (...args: CommandArgs<I, PluginType.Init>) => PluginResult,
) {
    return makePlugin(PluginType.Init, execute);
}
/**
 * @since 2.5.0
 */
export function CommandControlPlugin<I extends CommandType>(
    execute: (...args: CommandArgs<I, PluginType.Control>) => PluginResult,
) {
    return makePlugin(PluginType.Control, execute);
}
/**
 * @since 2.5.0
 */
export function EventControlPlugin<I extends EventType>(
    execute: (...args: EventArgs<I, PluginType.Control>) => PluginResult,
) {
    return makePlugin(PluginType.Control, execute);
}

/**
 * @since 2.5.0
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

/**
 * @since 1.0.0
 * The object passed into every plugin to control a command's behavior
 */
export const controller = {
    next: ok,
    stop: err,
};
