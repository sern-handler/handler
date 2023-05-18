import { Err, Ok } from 'ts-results-es';
import { ApplicationCommandOptionType, AutocompleteInteraction } from 'discord.js';
import type { SernAutocompleteData, SernOptionsData } from './types/modules';
import { AnyCommandPlugin, AnyEventPlugin, Plugin } from './types/plugins';
import { PluginType } from './structures';

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
    const _options = options.slice(); // required to prevent direct mutation of options
    let autocompleteData: SernAutocompleteData | undefined;

    while (_options.length > 0) {
        const cur = _options.pop()!;
        switch (cur.type) {
            case ApplicationCommandOptionType.Subcommand:
            case ApplicationCommandOptionType.SubcommandGroup:
                {
                    for (const option of cur.options ?? []) {
                        _options.push(option);
                    }
                }
                break;
            default:
                {
                    if (cur.autocomplete) {
                        const choice = iAutocomplete.options.getFocused(true);
                        if (cur.name === choice.name && cur.autocomplete) {
                            autocompleteData = cur;
                        }
                    }
                }
                break;
        }
    }
    return autocompleteData;
}
