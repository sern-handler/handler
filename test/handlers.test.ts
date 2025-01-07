//@ts-nocheck
import { beforeEach, describe, expect, it, test } from 'vitest';
import { callInitPlugins, eventDispatcher } from '../src/handlers/event-utils';

import { Client } from 'discord.js'
import { faker } from '@faker-js/faker';
import { Module } from '../src/types/core-modules';
import { Processed } from '../src/types/core-modules';
import { EventEmitter } from 'events';
import { CommandControlPlugin, CommandInitPlugin, CommandType, controller } from '../src';
import { createRandomModule, createRandomInitPlugin } from './setup/util';



function mockDeps() {
   return {
        '@sern/client': new Client(),
        '@sern/emitter': new EventEmitter()
   }
}
 
describe('eventDispatcher standard', () => {
    let m: Processed<Module>;
    let ee: EventEmitter;
    beforeEach(() => {
        ee = new EventEmitter();
        m = createRandomModule();
    });

    it('should throw', () => {
        expect(() => eventDispatcher(mockDeps(), m,  'not event emitter')).toThrowError();
    });

    it("Shouldn't throw", () => {
        expect(() => eventDispatcher(mockDeps(), m, ee)).not.toThrowError();
    });
});

describe('calling init plugins', async () => {
   let deps;
   beforeEach(() => {
       deps = mockDeps()
   });

   test ('call init plugins', async () => {
       const plugins = createRandomInitPlugin('go', { name: "abc" })
       const mod = createRandomModule([plugins])
       const s = await callInitPlugins(mod, deps, false)
       expect("abc").equal(s.name)
   })
   test('init plugins replace array', async () => {
       const plugins = createRandomInitPlugin('go', { opts: [] })
       const plugins2 = createRandomInitPlugin('go', { opts: ['a'] })
       const mod = createRandomModule([plugins, plugins2])
       const s = await callInitPlugins(mod, deps, false)
       expect(['a']).deep.equal(s.opts)
   })

})




test('form sdt', async () => {

    const expectedObject = { 
        "plugin/abc": faker.person.jobArea(),
        "plugin2/abc": faker.git.branch(),
        "plugin3/cheese": faker.person.jobArea()
    }
    
    const plugin = CommandControlPlugin<CommandType.Slash>((ctx,sdt) => {
        return controller.next({ "plugin/abc": expectedObject['plugin/abc'] });
    });
    const plugin2 = CommandControlPlugin<CommandType.Slash>((ctx,sdt) => {
        return controller.next({ "plugin2/abc": expectedObject['plugin2/abc'] });
    });
    const plugin3 = CommandControlPlugin<CommandType.Slash>((ctx,sdt) => {
        return controller.next({ "plugin3/cheese": expectedObject['plugin3/cheese'] });
    });
    
})


