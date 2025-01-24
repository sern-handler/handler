import type { Module, SernAutocompleteData, SernOptionsData } from '../types/core-modules';
import type {
    AnySelectMenuInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    UserContextMenuCommandInteraction,
    AutocompleteInteraction
} from 'discord.js';
import { ApplicationCommandOptionType, InteractionType } from 'discord.js';
import { PluginType } from './structures/enums';
import assert from 'assert';
import type { Payload, UnpackedDependencies } from '../types/utility';

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

/**
 * Uses an iterative DFS to check if an autocomplete node exists on the option tree
 * @param iAutocomplete
 * @param options
 */
export function treeSearch(
    iAutocomplete: AutocompleteInteraction,
    options: SernOptionsData[] | undefined,
): SernAutocompleteData & { parent?: string } | undefined {
    if (options === undefined) return undefined;
    //clone to prevent mutation of original command module
    const _options = options.map(a => ({ ...a }));
    const subcommands = new Set();
    while (_options.length > 0) {
        const cur = _options.pop()!;
        switch (cur.type) {
            case ApplicationCommandOptionType.Subcommand: {
                    subcommands.add(cur.name);
                    for (const option of cur.options ?? []) _options.push(option);
                } break;
            case ApplicationCommandOptionType.SubcommandGroup: {
                    for (const command of cur.options ?? []) _options.push(command);
                } break;
            default: {
                if ('autocomplete' in cur && cur.autocomplete) {
                    const choice = iAutocomplete.options.getFocused(true);
                    assert( 'command' in cur, 'No `command` property found for option ' + cur.name);
                    if (subcommands.size > 0) {
                        const parent = iAutocomplete.options.getSubcommand();
                        const parentAndOptionMatches =
                            subcommands.has(parent) && cur.name === choice.name;
                        if (parentAndOptionMatches) {
                            return { ...cur, parent };
                        }
                    } else {
                        if (cur.name === choice.name) {
                            return { ...cur, parent: undefined };
                        }
                    }
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
