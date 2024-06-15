//@ts-nocheck
import { beforeEach, describe, expect, vi, it, test } from 'vitest';
import { callInitPlugins, eventDispatcher } from '../src/handlers/event-utils';

import { Client, ChatInputCommandInteraction } from 'discord.js'
import { faker } from '@faker-js/faker';
import { Module } from '../src/types/core-modules';
import { Processed } from '../src/types/core-modules';
import { EventEmitter } from 'events';
import { EventType } from '../dist/core/structures/enums';
import { CommandControlPlugin, CommandInitPlugin, CommandType, controller } from '../src';

vi.mock('discord.js', async (importOriginal) => {
    const mod = await importOriginal()
    const ModalSubmitInteraction = class {
        customId;
        type = 5;
        isModalSubmit = vi.fn();
        constructor(customId) {
            this.customId = customId;
        }
    };
    const ButtonInteraction = class {
        customId;
        type = 3;
        componentType = 2;
        isButton = vi.fn();
        constructor(customId) {
            this.customId = customId;
        }
    };
    const AutocompleteInteraction = class {
        type = 4;
        option: string;
        constructor(s: string) {
            this.option = s;
        }
        options = {
            getFocused: vi.fn(),
            getSubcommand: vi.fn(),
        };
    };

    return {
        Client : vi.fn(),
        Collection: mod.Collection,
        ComponentType: mod.ComponentType,
        InteractionType: mod.InteractionType,
        ApplicationCommandOptionType: mod.ApplicationCommandOptionType,
        ApplicationCommandType: mod.ApplicationCommandType, 
        ModalSubmitInteraction,
        ButtonInteraction,
        AutocompleteInteraction,
        ChatInputCommandInteraction: vi.fn()
    };
});

function createRandomPlugin (s: 'go', mut?: Partial<Module>) {
    return CommandInitPlugin(({ module }) => {
        if(mut) {
            Object.entries(mut).forEach(([k, v]) => {
                module[k] = v
            })
        }
        return  s == 'go'
            ? controller.next()
            : controller.stop()
    })
}
function createRandomModule(plugins: any[]): Processed<Module> {
    return {
        type: EventType.Discord,
        meta: { id:"", absPath: "" },
        description: faker.string.alpha(),
        plugins, 
        name: "cheese",
        onEvent: [],
        execute: vi.fn(),
    };
}

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

test ('call init plugins', async () => {
    const deps = mockDeps()
    const plugins = createRandomPlugin('go', { name: "abc" })
    const mod = createRandomModule([plugins])
    const s = await callInitPlugins(mod, deps, false)
    expect("abc").equal(s.name)
})

test('init plugins replace array', async () => {
    const deps = mockDeps()
    const plugins = createRandomPlugin('go', { opts: [] })
    const plugins2 = createRandomPlugin('go', { opts: ['a'] })
    const mod = createRandomModule([plugins, plugins2])
    const s = await callInitPlugins(mod, deps, false)
    expect(['a']).deep.equal(s.opts)
})

test('call control plugin ', async () => {
    const plugin = CommandControlPlugin<CommandType.Slash>((ctx,sdt) => {
        return controller.next();
    });
    const res = await plugin.execute(new ChatInputCommandInteraction(), {})
    expect(res.isOk()).toBe(true)
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


