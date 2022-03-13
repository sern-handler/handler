import type { ApplicationCommandOptionData } from 'discord.js';
import type { CommandType } from '../sern';

/**
 * An object that gets imported and acts as a command.
 * @typedef {object} Module<T=string>
 * @property {string} desc
 * @property {CommandType} type
 * @property {(eventParams : Context, args : Ok<T=string) => Awaitable<possibleOutput | void>)} execute
 * @prop {(ctx: Context, args: Arg) => Utils.ArgType<T>} parse
 */

interface CommandOptions {
    commandType : CommandType,
    alias : string[] | [],
    options?: ApplicationCommandOptionData[],
    name? : string | undefined

}

export default CommandOptions;
