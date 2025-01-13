import { CommandType, PluginType } from './structures/enums';
import type { Plugin, PluginResult, CommandArgs, InitArgs } from '../types/core-plugin';
import { Err, Ok } from './structures/result';
import type { Dictionary } from '../types/utility';

export function makePlugin<V extends unknown[]>(
    type: PluginType,
    execute: (...args: any[]) => any,
): Plugin<V> {
    return { type, execute } as Plugin<V>;
}
/**
 * @since 2.5.0
 */
export function EventInitPlugin(execute: (args: InitArgs) => PluginResult) {
    return makePlugin(PluginType.Init, execute);
}

/**
 * Creates an initialization plugin for command preprocessing and modification
 * 
 * @since 2.5.0
 * @template I - Extends CommandType to enforce type safety for command modules
 * 
 * @param {function} execute - Function to execute during command initialization
 * @param {InitArgs<T>} execute.args - The initialization arguments
 * @param {T} execute.args.module - The command module being initialized
 * @param {string} execute.args.absPath - The absolute path to the module file
 * @param {Dependencies} execute.args.deps - Dependency injection container
 * 
 * @returns {Plugin} A plugin that runs during command initialization
 * 
 * @example
 * // Plugin to update command description
 * export const updateDescription = (description: string) => {
 *   return CommandInitPlugin(({ deps }) => {
 *     if(description.length > 100) {
 *       deps.logger?.info({ message: "Invalid description" })
 *       return controller.stop("From updateDescription: description is invalid");
 *     }
 *     module.description = description;
 *     return controller.next();
 *   });
 * };
 * 
 * @example
 * // Plugin to store registration date in module locals
 * export const dateRegistered = () => {
 *   return CommandInitPlugin(({ module }) => {
 *     module.locals.registered = Date.now()
 *     return controller.next();
 *   });
 * };
 * 
 * @remarks
 * - Init plugins can modify how commands are loaded and perform preprocessing
 * - The module.locals object can be used to store custom plugin-specific data
 * - Be careful when modifying module fields as multiple plugins may interact with them
 * - Use controller.next() to continue to the next plugin
 * - Use controller.stop(reason) to halt plugin execution
 */
export function CommandInitPlugin<I extends CommandType>(
    execute: (args: InitArgs) => PluginResult
): Plugin {
    return makePlugin(PluginType.Init, execute);
}

/**
 * Creates a control plugin for command preprocessing, filtering, and state management
 * 
 * @since 2.5.0
 * @template I - Extends CommandType to enforce type safety for command modules
 * 
 * @param {function} execute - Function to execute during command control flow
 * @param {CommandArgs<I>} execute.args - The command arguments array
 * @param {Context} execute.args[0] - The discord context (e.g., guild, channel, user info, interaction)
 * @param {SDT} execute.args[1] - The State, Dependencies, Params, Module, and Type object
 * 
 * @returns {Plugin} A plugin that runs during command execution flow
 * 
 * @example
 * // Plugin to restrict command to specific guild
 * export const inGuild = (guildId: string) => {
 *   return CommandControlPlugin((ctx, sdt) => {
 *     if(ctx.guild.id !== guildId) {
 *       return controller.stop();
 *     }
 *     return controller.next();
 *   });
 * };
 * 
 * @example
 * // Plugins passing state through the chain
 * const plugin1 = CommandControlPlugin((ctx, sdt) => {
 *   return controller.next({ 'plugin1/data': 'from plugin1' });
 * });
 * 
 * const plugin2 = CommandControlPlugin((ctx, sdt) => {
 *   return controller.next({ 'plugin2/data': ctx.user.id });
 * });
 * 
 * export default commandModule({
 *   type: CommandType.Slash,
 *   plugins: [plugin1, plugin2],
 *   execute: (ctx, sdt) => {
 *     console.log(sdt.state); // Access accumulated state
 *   }
 * });
 * 
 * @remarks
 * - Control plugins are executed in order when a discord.js event is emitted
 * - Use controller.next() to continue to next plugin or controller.stop() to halt execution
 * - State can be passed between plugins using controller.next({ key: value })
 * - State keys should be namespaced to avoid collisions (e.g., 'plugin-name/key')
 * - Final accumulated state is passed to the command's execute function
 * - All plugins must succeed for the command to execute
 * - Plugins have access to dependencies through the sdt.deps object
 * - Useful for implementing preconditions, filters, and command preprocessing
 */
export function CommandControlPlugin<I extends CommandType>(
    execute: (...args: CommandArgs<I>) => PluginResult,
) {
    return makePlugin(PluginType.Control, execute);
}


/**
 * @since 1.0.0
 * The object passed into every plugin to control a command's behavior
 */
export const controller = {
    next: (val?: Dictionary) => Ok(val),
    stop: (val?: string) => Err(val),
};


export type Controller = typeof controller;
