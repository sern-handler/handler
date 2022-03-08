import type { Visibility,  possibleOutput, Arg } from '../../types/handler';
import type { CommandType } from '../sern';
import type  Context  from './context' ;
import type { Awaitable } from 'discord.js';
import type { Ok } from 'ts-results';
import type * as Utils from '../utilities/preprocessors/args';

/**
 * An object that gets imported and acts as a command.
 * @typedef {object} Module<T=string>
 * @property {string} desc
 * @property {Visibility} visibility
 * @property {CommandType} type
 * @property {(eventParams : Context, args : Ok<T=string) => Awaitable<possibleOutput | void>)} execute
 * @prop {(ctx: Context, args: Arg) => Utils.ArgType<T>} parse
 */

interface Module<T = string> {
    alias: string[];
    desc: string;
    visibility: Visibility;
    type: CommandType;
    test: boolean;
    execute: (eventParams: Context, args: Ok<T>) => Awaitable<possibleOutput | void>;
    parse?: (ctx: Context, args: Arg) => Utils.ArgType<T>;
}

export default Module;
