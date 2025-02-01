import { describe } from 'node:test'
import { bench } from 'vitest'
import { SernAutocompleteData, SernOptionsData } from '../src'
import { createRandomChoice } from './setup/util'
import { ApplicationCommandOptionType, AutocompleteFocusedOption, AutocompleteInteraction } from 'discord.js'
import { createLookupTable } from '../src/core/functions'
import assert from 'node:assert'

/**
 * Uses an iterative DFS to check if an autocomplete node exists on the option tree
 * This is the old internal method that sern used to resolve autocomplete
 * @param iAutocomplete
 * @param options
 */
function treeSearch(
    choice: AutocompleteFocusedOption,
    parent: string|undefined,
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
                    assert( 'command' in cur, 'No `command` property found for option ' + cur.name);
                    if (subcommands.size > 0) {
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

const options: SernOptionsData[] = [
    createRandomChoice(),
    createRandomChoice(),
    createRandomChoice(),
    {
        type: ApplicationCommandOptionType.String,
        name: 'autocomplete',
        description: 'here',
        autocomplete: true,
        command: { onEvent: [], execute: () => {} },
    },
]


const table =  createLookupTable(options)


describe('autocomplete lookup', () => {

    bench('lookup table', () => {
         table.get('<parent>/autocomplete')
    }, { time: 500 })   


    bench('naive treeSearch', () => {
        treeSearch({ focused: true, 
                     name: 'autocomplete',
                     value: 'autocomplete',
                     type: ApplicationCommandOptionType.String }, undefined, options)
    }, { time: 500 })
})
