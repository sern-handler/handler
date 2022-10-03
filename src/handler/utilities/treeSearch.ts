import type { SernAutocompleteData, SernOptionsData } from '../structures/module';
import { ApplicationCommandOptionType, AutocompleteInteraction } from 'discord.js';

export default function treeSearch(
    iAutocomplete: AutocompleteInteraction,
    options: SernOptionsData[] | undefined,
): SernAutocompleteData {
    if (options === undefined) return undefined;
    const _options = options.slice(); // required to prevent direct mutation of options
    let autocompleteData: SernAutocompleteData;

    while (_options.length > 0) {
        const cur = _options.pop()!;
        switch (cur.type) {
            case ApplicationCommandOptionType.Subcommand:
                {
                    for (const option of cur.options ?? []) {
                        _options.push(option);
                    }
                }
                break;
            case ApplicationCommandOptionType.SubcommandGroup:
                {
                    for (const command of cur.options ?? []) {
                        _options.push(command);
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
