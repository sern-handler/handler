import { describe, it } from "vitest";
import { PluginType, SernOptionsData, controller } from '../../src/index'
import { partitionPlugins, treeSearch } from "../../src/core/functions";
import { expect } from "chai";
import { faker } from '@faker-js/faker';
import { ApplicationCommandOptionType } from "discord.js";

describe('functions', () => {
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
        const options : SernOptionsData[] = [
            createRandomChoice(),
            createRandomChoice(),
            createRandomChoice(),
            { type: ApplicationCommandOptionType.String,
              name: 'autocomplete',
              description: 'here',
              autocomplete: true,
              command : { onEvent: [], execute:(a) => {} } 
            }
        ];


    })

})
