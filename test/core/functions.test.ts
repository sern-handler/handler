import { afterEach, describe, expect, it, vi } from "vitest";
import { PluginType, SernOptionsData, controller } from '../../src/index'
import { partitionPlugins, treeSearch } from "../../src/core/functions";
import { faker } from '@faker-js/faker';
import { ApplicationCommandOptionType, AutocompleteInteraction } from "discord.js";

vi.mock('discord.js', () => {

        const Collection = Map
        const ModalSubmitInteraction = class {
            customId
            type = 5
            isModalSubmit = vi.fn()
            constructor(customId) {
                this.customId = customId
            }
        }
        const ButtonInteraction = class {
            customId
            type = 3
            componentType = 2
            isButton = vi.fn()
            constructor(customId) {
                this.customId = customId
            }
        }
        const AutocompleteInteraction = class {
            type = 4;
            option: string
            constructor(s: string) {
                this.option = s;
            }
            options = {
               getFocused : vi.fn()
            }
        }

        return {
            Collection,
            ComponentType: { 
                Button: 2
            },
            InteractionType : {
                Ping: 1,
                ApplicationCommand: 2,
                MessageComponent: 3,
                ApplicationCommandAutocomplete:4,
                ModalSubmit: 5
            },
            ApplicationCommandOptionType : {
               Subcommand : 1,
               SubcommandGroup : 2,
               String : 3,
               Integer : 4,
               Boolean : 5,
               User : 6,
               Channel : 7,
               Role : 8,
               Mentionable : 9,
               Number : 10,
               Attachment : 11
            },
            ModalSubmitInteraction,
            ButtonInteraction,
            AutocompleteInteraction
        };
})

describe('functions', () => { 
    afterEach(() => {  vi.clearAllMocks() })
    function createRandomPlugins(len: number) {
        const random = () => Math.floor(Math.random()*2)+1; // 1 or 2, plugin enum
        return Array.from({ length: len }, () => ({ type: random(), execute: () => random() === 1 ? controller.next():controller.stop() }))
    }
    function createRandomChoice() {
        return {
            type: faker.number.int({ min: 1, max: 11}),
            name: faker.word.noun(),
            description: faker.word.adjective(),
        }  
    }
    it('should partition plugins correctly', () => {
         const plugins = createRandomPlugins(100); 
         const [ onEvent, init ] = partitionPlugins(plugins)
         for(const el of onEvent) 
            expect(el.type).to.equal(PluginType.Control)
         
         for(const el of init) 
            expect(el.type).to.equal(PluginType.Init)
    })
    
    it('should tree search options tree depth 1', () => {
        //@ts-expect-error mocking
        let autocmpInteraction = new AutocompleteInteraction('autocomplete');
        const options : SernOptionsData[] = [
            createRandomChoice(),
            createRandomChoice(),
            createRandomChoice(),
            { 
              type: ApplicationCommandOptionType.String,
              name: 'autocomplete',
              description: 'here',
              autocomplete: true,
              command : { onEvent: [], execute:(a) => {} } 
            }
        ];
        autocmpInteraction.options.getFocused.mockReturnValue(
            {
                name: 'autocomplete',
                value: faker.string.alpha(),
                focused: true
            },
        );
        const result = treeSearch(autocmpInteraction, options);
        expect(result == undefined).to.be.false;
        expect(result.name).to.be.eq('autocomplete');
        expect(result.command).to.be.not.undefined;

    }),
    it('should tree search depth 2', () => {
        //@ts-expect-error mocking
        let autocmpInteraction = new AutocompleteInteraction('nested');
        const options : SernOptionsData[] = [
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: faker.string.alpha(),
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
                        execute:() => {}
                    }
                   }
                ]
            }
            
        ];
        autocmpInteraction.options.getFocused.mockReturnValue(
            {
                name: 'nested',
                value: faker.string.alpha(),
                focused: true
            }
        );
        const result = treeSearch(autocmpInteraction, options);
        expect(result == undefined).to.be.false;
        expect(result.name).to.be.eq('nested');
        expect(result.command).to.be.not.undefined;

    })

    it('should tree search depth n > 2', () => {
        //@ts-expect-error mocking
        let autocmpInteraction = new AutocompleteInteraction('nested');
        const options : SernOptionsData[] = [
            {
                
                type: ApplicationCommandOptionType.SubcommandGroup,
                name: faker.string.alpha(),
                description: faker.string.alpha(),
                options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: faker.string.alpha(),
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
                            execute:() => {}
                        }
                        }
                    ]
                }]
            },
        ];
        autocmpInteraction.options.getFocused.mockReturnValue(
            {
                name: 'nested',
                value: faker.string.alpha(),
                focused: true
            }
        );
        const result = treeSearch(autocmpInteraction, options);
        expect(result == undefined).to.be.false;
        expect(result.name).to.be.eq('nested');
        expect(result.command).to.be.not.undefined;
    })


})


