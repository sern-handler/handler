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
 * Creates a command module with standardized structure and plugin support.
 * 
 * @since 1.0.0
 * @param {InputCommand} mod - Command module configuration
 * @returns {Module} Processed command module ready for registration
 * 
 * @example
 * // Basic slash command
 * export default commandModule({
 *   type: CommandType.Slash,
 *   description: "Ping command",
 *   execute: async (ctx) => {
 *     await ctx.reply("Pong! 🏓");
 *   }
 * });
 * 
 * @example
 * // Command with component interaction
 * export default commandModule({
 *   type: CommandType.Slash,
 *   description: "Interactive command",
 *   execute: async (ctx) => {
 *     const button = new ButtonBuilder({
 *       customId: "btn/someData",
 *       label: "Click me",
 *       style: ButtonStyle.Primary
 *     });
 *     await ctx.reply({
 *       content: "Interactive message",
 *       components: [new ActionRowBuilder().addComponents(button)]
 *     });
 *   }
 * });
 */
export function commandModule(mod: InputCommand): Module {
    const [onEvent, plugins] = partitionPlugins(mod.plugins);
    return { ...mod,
             onEvent,
             plugins,
             locals: {} } as Module;
}


/**
 * Creates an event module for handling Discord.js or custom events.
 * 
 * @since 1.0.0
 * @template T - Event name from ClientEvents
 * @param {InputEvent<T>} mod - Event module configuration
 * @returns {Module} Processed event module ready for registration
 * @throws {Error} If ControlPlugins are used in event modules
 * 
 * @example
 * // Discord event listener
 * export default eventModule({
 *   type: EventType.Discord,
 *   execute: async (message) => {
 *     console.log(`${message.author.tag}: ${message.content}`);
 *   }
 * });
 * 
 * @example
 * // Custom sern event
 * export default eventModule({
 *   type: EventType.Sern,
 *   execute: async (eventData) => {
 *     // Handle sern-specific event
 *   }
 * });
 */
export function eventModule<T extends keyof ClientEvents = keyof ClientEvents>(mod: InputEvent<T>): Module {
    const [onEvent, plugins] = partitionPlugins(mod.plugins);
    if(onEvent.length !== 0) throw Error("Event modules cannot have ControlPlugins");
    return { ...mod,
             plugins,
             locals: {} } as Module;
}

/** Create event modules from discord.js client events,
 * This was an {@link eventModule} for discord events,
 * where typings were bad.
 * @deprecated Use {@link eventModule} instead
 * @param mod
 */
export function discordEvent<T extends keyof ClientEvents>(mod: {
    name: T;
    once?: boolean;
    execute: (...args: ClientEvents[T]) => Awaitable<unknown>;
}) {
    return eventModule({ type: EventType.Discord, ...mod, });
}

export function scheduledTask(ism: ScheduledTask) { return ism }

