import { Err, Ok } from 'ts-results-es';
import { ApplicationCommandOptionType, AutocompleteInteraction } from 'discord.js';
import type { SernAutocompleteData, SernOptionsData } from '../types/module';

//function wrappers for empty ok / err
export const ok = /* @__PURE__*/ () => Ok.EMPTY;
export const err = /* @__PURE__*/ () => Err.EMPTY;

export function partition<T, V>(arr: (T & V)[], condition: (e: T & V) => boolean): [T[], V[]] {
    const t: T[] = [];
    const v: V[] = [];
    for (const el of arr) {
        if (condition(el)) {
            t.push(el as T);
        } else {
            v.push(el as V);
        }
    }
    return [t, v];
}

/**
 * Uses an iterative DFS to check if an autocomplete node exists
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
