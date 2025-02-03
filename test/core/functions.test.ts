//@ts-nocheck
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PluginType, SernOptionsData, controller } from '../../src/index';
import { createLookupTable, partitionPlugins, treeSearch } from '../../src/core/functions';
import { faker } from '@faker-js/faker';
import { ApplicationCommandOptionType, AutocompleteInteraction } from 'discord.js';
import { createRandomChoice, createRandomPlugins } from '../setup/util';

describe('functions', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });
    
    
    it('should partition plugins correctly', () => {
        const plugins = createRandomPlugins(100);
        const [onEvent, init] = partitionPlugins(plugins);
        for (const el of onEvent) expect(el.type).to.equal(PluginType.Control);

        for (const el of init) expect(el.type).to.equal(PluginType.Init);
    });

    describe('autocomplete', ( ) => {
        
        it('should tree search options tree depth 1', () => {
            const options: SernOptionsData[] = [
                createRandomChoice(),
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'autocomplete',
                    description: 'here',
                    autocomplete: true,
                    command: { onEvent: [], execute: vi.fn() },
                },
            ];
            const table = createLookupTable(options)
            console.log(table)
            const result = table.get('<parent>/autocomplete')
            expect(result == undefined).to.be.false;
            expect(result.name).to.be.eq('autocomplete');
            expect(result.command).to.be.not.undefined;
        }),
            it('should tree search depth 2', () => {
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
                const table = createLookupTable(options)
                const result = table.get(`<parent>/${subcommandName}/nested`)
                expect(result == undefined).to.be.false;
                expect(result.name).to.be.eq('nested');
                expect(result.command).to.be.not.undefined;
            });

        it('should tree search depth n > 2', () => {
            const subgroupName = faker.string.alpha()
            const subcommandName = faker.string.alpha();
            const options: SernOptionsData[] = [
                {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: subgroupName,
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
            const table = createLookupTable(options)
            const result = table.get(`<parent>/${subgroupName}/${subcommandName}/nested`)
            expect(result == undefined).to.be.false;
            expect(result.name).to.be.eq('nested');
            expect(result.command).to.be.not.undefined;
        });

        it('should correctly resolve suboption of the same name given two subcommands ', () => {
            const subcommandName = faker.string.alpha();
            const groupname = faker.string.alpha()
            const options: SernOptionsData[] = [
                {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: groupname,
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
            const table = createLookupTable(options)
            const result = table.get(`<parent>/${groupname}/${subcommandName}/nested`);
            expect(result).toBeTruthy();
            expect(result.name).to.be.eq('nested');
            expect(result.command).to.be.not.undefined;
        });
        it('two subcommands with an option of the same name', () => {
            const groupName = faker.string.alpha()
            const subcommandName = faker.string.alpha();
            const options: SernOptionsData[] = [
                {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: groupName,
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
                            name: subcommandName + 'anothera',
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
            
            const table = createLookupTable(options)
            const result = table.get(`<parent>/${groupName}/${subcommandName}/nested`);
            expect(result).toBeTruthy();
            expect(result.name).to.be.eq('nested');
            expect(result.command).to.be.not.undefined;


        });

        it('simulates autocomplete typing and resolution', () => {
            const subcommandGroupName = faker.string.alpha()
            const subcommandName = faker.string.alpha();
            const optionName = faker.word.noun();
            const options: SernOptionsData[] = [
                {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: subcommandGroupName,
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
            const table = createLookupTable(options)
            for (const char of optionName) {
                accumulator += char;

                const focusedValue = {
                    name: accumulator,
                    value: faker.string.alpha(),
                    focused: true,
                };
                result = table.get(`<parent>/${subcommandGroupName}/${subcommandName}/${focusedValue.name}` );
            }
            expect(result).toBeTruthy();
        });
    })


});
