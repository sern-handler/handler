//@ts-nocheck

import { afterEach, describe, expect, it, vi } from 'vitest';
import { PluginType, SernOptionsData, controller } from '../../src/index';
import { partitionPlugins, treeSearch } from '../../src/core/functions';
import { faker } from '@faker-js/faker';
import { ApplicationCommandOptionType, AutocompleteInteraction } from 'discord.js';

describe('functions', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });
    function createRandomPlugins(len: number) {
        const random = () => Math.floor(Math.random() * 2) + 1; // 1 or 2, plugin enum
        return Array.from({ length: len }, () => ({
            type: random(),
            execute: () => (random() === 1 ? controller.next() : controller.stop()),
        }));
    }
    function createRandomChoice() {
        return {
            type: faker.number.int({ min: 1, max: 11 }),
            name: faker.word.noun(),
            description: faker.word.adjective(),
        };
    }
    it('should partition plugins correctly', () => {
        const plugins = createRandomPlugins(100);
        const [onEvent, init] = partitionPlugins(plugins);
        for (const el of onEvent) expect(el.type).to.equal(PluginType.Control);

        for (const el of init) expect(el.type).to.equal(PluginType.Init);
    });

    it('should tree search options tree depth 1', () => {
        //@ts-expect-error mocking
        let autocmpInteraction = new AutocompleteInteraction('autocomplete');
        const options: SernOptionsData[] = [
            createRandomChoice(),
            createRandomChoice(),
            createRandomChoice(),
            {
                type: ApplicationCommandOptionType.String,
                name: 'autocomplete',
                description: 'here',
                autocomplete: true,
                command: { onEvent: [], execute: vi.fn() },
            },
        ];
        autocmpInteraction.options.getFocused.mockReturnValue({
            name: 'autocomplete',
            value: faker.string.alpha(),
            focused: true,
        });
        const result = treeSearch(autocmpInteraction, options);
        expect(result == undefined).to.be.false;
        expect(result.name).to.be.eq('autocomplete');
        expect(result.command).to.be.not.undefined;
    }),
        it('should tree search depth 2', () => {
            //@ts-expect-error mocking
            let autocmpInteraction = new AutocompleteInteraction('nested');
            const subcommandName = faker.string.alpha();
            const options: SernOptionsData[] = [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: subcommandName,
                    description: faker.string.alpha(),
                    options: [
                        createRandomChoice(),
                        createRandomChoice(),
                        createRandomChoice(),
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'nested',
                            description: faker.string.alpha(),
                            autocomplete: true,
                            command: {
                                onEvent: [],
                                execute: () => {},
                            },
                        },
                    ],
                },
            ];
            autocmpInteraction.options.getSubcommand.mockReturnValue(subcommandName);
            autocmpInteraction.options.getFocused.mockReturnValue({
                name: 'nested',
                value: faker.string.alpha(),
                focused: true,
            });
            const result = treeSearch(autocmpInteraction, options);
            expect(result == undefined).to.be.false;
            expect(result.name).to.be.eq('nested');
            expect(result.command).to.be.not.undefined;
        });

    it('should tree search depth n > 2', () => {
        //@ts-expect-error mocking
        let autocmpInteraction = new AutocompleteInteraction('nested');
        const subcommandName = faker.string.alpha();
        const options: SernOptionsData[] = [
            {
                type: ApplicationCommandOptionType.SubcommandGroup,
                name: faker.string.alpha(),
                description: faker.string.alpha(),
                options: [
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: subcommandName,
                        description: faker.string.alpha(),
                        options: [
                            createRandomChoice(),
                            createRandomChoice(),
                            {
                                type: ApplicationCommandOptionType.String,
                                name: 'nested',
                                description: faker.string.alpha(),
                                autocomplete: true,
                                command: {
                                    onEvent: [],
                                    execute: () => {},
                                },
                            },
                            createRandomChoice(),
                        ],
                    },
                ],
            },
        ];
        autocmpInteraction.options.getSubcommand.mockReturnValue(subcommandName);
        autocmpInteraction.options.getFocused.mockReturnValue({
            name: 'nested',
            value: faker.string.alpha(),
            focused: true,
        });
        const result = treeSearch(autocmpInteraction, options);
        expect(result == undefined).to.be.false;
        expect(result.name).to.be.eq('nested');
        expect(result.command).to.be.not.undefined;
    });
    it('should correctly resolve suboption of the same name given two subcommands ', () => {
        let autocmpInteraction = new AutocompleteInteraction('nested');
        const subcommandName = faker.string.alpha();
        const options: SernOptionsData[] = [
            {
                type: ApplicationCommandOptionType.SubcommandGroup,
                name: faker.string.alpha(),
                description: faker.string.alpha(),
                options: [
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: subcommandName,
                        description: faker.string.alpha(),
                        options: [
                            createRandomChoice(),
                            createRandomChoice(),
                            {
                                type: ApplicationCommandOptionType.String,
                                name: 'nested',
                                description: faker.string.alpha(),
                                autocomplete: true,
                                command: {
                                    onEvent: [],
                                    execute: () => {},
                                },
                            },
                        ],
                    },
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: subcommandName + 'a',
                        description: faker.string.alpha(),
                        options: [
                            createRandomChoice(),
                            {
                                type: ApplicationCommandOptionType.String,
                                name: 'nested',
                                description: faker.string.alpha(),
                                autocomplete: true,
                                command: {
                                    onEvent: [],
                                    execute: () => {},
                                },
                            },
                        ],
                    },
                ],
            },
        ];
        autocmpInteraction.options.getSubcommand.mockReturnValue(subcommandName);
        autocmpInteraction.options.getFocused.mockReturnValue({
            name: 'nested',
            value: faker.string.alpha(),
            focused: true,
        });
        const result = treeSearch(autocmpInteraction, options);
        expect(result).toBeTruthy();
        expect(result.name).to.be.eq('nested');
        expect(result.command).to.be.not.undefined;
    });
    it('two subcommands with an option of the same name', () => {
        let autocmpInteraction = new AutocompleteInteraction('nested');
        const subcommandName = faker.string.alpha();
        const options: SernOptionsData[] = [
            {
                type: ApplicationCommandOptionType.SubcommandGroup,
                name: faker.string.alpha(),
                description: faker.string.alpha(),
                options: [
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: subcommandName,
                        description: faker.string.alpha(),
                        options: [
                            createRandomChoice(),
                            createRandomChoice(),
                            {
                                type: ApplicationCommandOptionType.String,
                                name: 'nested',
                                description: faker.string.alpha(),
                                autocomplete: true,
                                command: {
                                    onEvent: [],
                                    execute: () => {},
                                },
                            },
                        ],
                    },
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: subcommandName + 'a',
                        description: faker.string.alpha(),
                        options: [
                            createRandomChoice(),
                            {
                                type: ApplicationCommandOptionType.String,
                                name: 'nested',
                                description: faker.string.alpha(),
                                autocomplete: true,
                                command: {
                                    onEvent: [],
                                    execute: () => {},
                                },
                            },
                        ],
                    },
                ],
            },
        ];
        autocmpInteraction.options.getSubcommand.mockReturnValue(subcommandName);
        autocmpInteraction.options.getFocused.mockReturnValue({
            name: 'nested',
            value: faker.string.alpha(),
            focused: true,
        });
        const result = treeSearch(autocmpInteraction, options);
        expect(result).toBeTruthy();
        expect(result.name).to.be.eq('nested');
        expect(result.command).to.be.not.undefined;

        let autocmpInteraction2 = new AutocompleteInteraction('nested');
        autocmpInteraction2.options.getSubcommand.mockReturnValue(subcommandName + 'a');
        autocmpInteraction2.options.getFocused.mockReturnValue({
            name: 'nested',
            value: faker.string.alpha(),
            focused: true,
        });
        const result2 = treeSearch(autocmpInteraction2, options);
        expect(result2).toBeTruthy();
        expect(result2?.name).toEqual('nested');
    });

    it('simulates autocomplete typing and resolution', () => {
        const subcommandName = faker.string.alpha();
        const optionName = faker.word.noun();
        const options: SernOptionsData[] = [
            {
                type: ApplicationCommandOptionType.SubcommandGroup,
                name: faker.string.alpha(),
                description: faker.string.alpha(),
                options: [
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: subcommandName,
                        description: faker.string.alpha(),
                        options: [
                            createRandomChoice(),
                            createRandomChoice(),
                            {
                                type: ApplicationCommandOptionType.String,
                                name: optionName,
                                description: faker.string.alpha(),
                                autocomplete: true,
                                command: {
                                    onEvent: [],
                                    execute: vi.fn(),
                                },
                            },
                        ],
                    },
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: subcommandName + 'a',
                        description: faker.string.alpha(),
                        options: [
                            createRandomChoice(),
                            {
                                type: ApplicationCommandOptionType.String,
                                name: optionName,
                                description: faker.string.alpha(),
                                autocomplete: true,
                                command: {
                                    onEvent: [],
                                    execute: vi.fn(),
                                },
                            },
                        ],
                    },
                ],
            },
        ];
        let accumulator = '';
        let result: unknown;
        for (const char of optionName) {
            accumulator += char;

            const autocomplete = new AutocompleteInteraction(accumulator);
            autocomplete.options.getSubcommand.mockReturnValue(subcommandName);
            autocomplete.options.getFocused.mockReturnValue({
                name: accumulator,
                value: faker.string.alpha(),
                focused: true,
            });
            result = treeSearch(autocomplete, options);
        }
        expect(result).toBeTruthy();
    });
});
