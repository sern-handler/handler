
import { ApplicationCommandOptionType, AutocompleteInteraction } from 'discord.js';
import type { SernAutocompleteData, SernOptionsData } from '../../types/module';

export default function treeSearch(
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