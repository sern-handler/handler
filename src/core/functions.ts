import type { Module, SernAutocompleteData, SernOptionsData } from '../types/core-modules';
import type {
    AnySelectMenuInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    UserContextMenuCommandInteraction,
    AutocompleteInteraction,
} from 'discord.js';
import { ApplicationCommandOptionType, InteractionType } from 'discord.js';
import { PluginType } from './structures/enums';
import type { Payload, UnpackedDependencies } from '../types/utility';
import path from 'node:path'

export const createSDT = (module: Module, deps: UnpackedDependencies, params: string|undefined) => {
    return {
        state: {},
        deps,
        params, 
        type: module.type,
        module: {
            name: module.name,
            description: module.description,
            locals: module.locals,
            meta: module.meta
        }
    }
}

/**
 * Removes the first character(s) _[depending on prefix length]_ of the message
 * @param msg
 * @param prefix The prefix to remove
 * @returns The message without the prefix
 * @example
 * message.content = '!ping';
 * console.log(fmt(message.content, '!'));
 * // [ 'ping' ]
 */
export function fmt(msg: string, prefix?: string): string[] {
    if(!prefix) throw Error("Unable to parse message without prefix");
    return msg.slice(prefix.length).trim().split(/\s+/g);
}


export function partitionPlugins<T,V>
(arr: Array<{ type: PluginType }> = []): [T[], V[]] {
    const controlPlugins = [];
    const initPlugins = [];
    for (const el of arr) {
        switch (el.type) {
            case PluginType.Control: controlPlugins.push(el); break;
            case PluginType.Init: initPlugins.push(el); break;
        }
    }
    return [controlPlugins, initPlugins] as [T[], V[]];
}

export const createLookupTable = (options: SernOptionsData[]): Map<string, SernAutocompleteData> => {
    const table = new Map<string, SernAutocompleteData>();
    _createLookupTable(table, options, "<parent>");
    return table;
}

const _createLookupTable = (table: Map<string, SernAutocompleteData>, options: SernOptionsData[], parent: string) => {
    for (const opt of options) {
        const name = path.join(parent, opt.name)
        switch(opt.type) {
            case ApplicationCommandOptionType.Subcommand: {
                    _createLookupTable(table, opt.options ?? [], name);
            } break;
            case ApplicationCommandOptionType.SubcommandGroup: {
                    _createLookupTable(table, opt.options ?? [], name);
            } break;
            default: {
                if(Reflect.get(opt, 'autocomplete') === true) {
                    table.set(name, opt as SernAutocompleteData)
                }
            } break;
        }
    } 

}

interface InteractionTypable {
    type: InteractionType;
}
//discord.js pls fix ur typings or i will >:(
type AnyMessageComponentInteraction = AnySelectMenuInteraction | ButtonInteraction;
type AnyCommandInteraction =
    | ChatInputCommandInteraction
    | MessageContextMenuCommandInteraction
    | UserContextMenuCommandInteraction;

export function isMessageComponent(i: InteractionTypable): i is AnyMessageComponentInteraction {
    return i.type === InteractionType.MessageComponent;
}
export function isCommand(i: InteractionTypable): i is AnyCommandInteraction {
    return i.type === InteractionType.ApplicationCommand;
}
export function isContextCommand(i: AnyCommandInteraction): i is MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction {
    return i.isContextMenuCommand();
}
export function isAutocomplete(i: InteractionTypable): i is AutocompleteInteraction {
    return i.type === InteractionType.ApplicationCommandAutocomplete;
}

export function isModal(i: InteractionTypable): i is ModalSubmitInteraction {
    return i.type === InteractionType.ModalSubmit;
}

export function resultPayload<T extends 'success'|'warning'|'failure'>
(type: T, module?: Module, reason?: unknown) {
    return { type, module, reason } as Payload & { type : T };
}

export function pipe<T>(arg: unknown, firstFn: Function, ...fns: Function[]): T {
  let result = firstFn(arg);
  for (let fn of fns) {
    result = fn(result);
  }
  return result;
}
