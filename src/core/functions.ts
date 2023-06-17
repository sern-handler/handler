import { Err, Ok } from 'ts-results-es';
import { ApplicationCommandOptionType, AutocompleteInteraction } from 'discord.js';
import type { SernAutocompleteData, SernOptionsData } from './types/modules';
import { AnyCommandPlugin, AnyEventPlugin, Plugin } from './types/plugins';
import { PluginType } from './structures';
import assert from 'assert';

//function wrappers for empty ok / err
export const ok = /* @__PURE__*/ () => Ok.EMPTY;
export const err = /* @__PURE__*/ () => Err.EMPTY;

export function partitionPlugins(
    arr: (AnyEventPlugin | AnyCommandPlugin)[] = [],
): [Plugin[], Plugin[]] {
    const controlPlugins = [];
    const initPlugins = [];
    for (const el of arr) {
        switch (el.type) {
            case PluginType.Control:
                controlPlugins.push(el);
                break;
            case PluginType.Init:
                initPlugins.push(el);
                break;
        }
    }
    return [controlPlugins, initPlugins];
}

/**
 * Uses an iterative DFS to check if an autocomplete node exists on the option tree
 * @param iAutocomplete
 * @param options
 */
export function treeSearch(
    iAutocomplete: AutocompleteInteraction,
    options: SernOptionsData[] | undefined,
): SernAutocompleteData | undefined {
    if (options === undefined) return undefined;
    //clone to prevent mutation of original command module 
    const _options = options.map(a => ({...a}));
    let subcommands = new Set();
    while (_options.length > 0) {
        const cur = _options.pop()!;
        switch (cur.type) {
            case ApplicationCommandOptionType.Subcommand:
                {
                    subcommands.add(cur.name);
                    for (const option of cur.options ?? []) 
                        _options.push(option);
                }
                break;
            case ApplicationCommandOptionType.SubcommandGroup:
                {
                    for (const command of cur.options ?? []) 
                        _options.push(command);
                }
                break;
            default:
                {
                    if ('autocomplete' in cur && cur.autocomplete) {
                        const choice = iAutocomplete.options.getFocused(true);
                        assert('command' in cur, "No command property found for autocomplete option");
                        if(subcommands.size > 0) {
                            const parent = iAutocomplete.options.getSubcommand(); 
                            const parentAndOptionMatches = subcommands.has(parent) && cur.name === choice.name;
                            if (parentAndOptionMatches) {
                                return cur;
                            }
                        } else {
                            if(cur.name === choice.name) {
                                return cur;
                            }
                        }
                    }
                }
                break;
        }
    }
}
