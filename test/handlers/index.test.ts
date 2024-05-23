//@ts-nocheck
import { beforeEach, describe, expect, vi, it } from 'vitest';
import { callInitPlugins, eventDispatcher } from '../../src/handlers/event-utils';

import { Client } from 'discord.js'
import { faker } from '@faker-js/faker';
import { Module } from '../../src/types/core-modules';
import { Processed } from '../../src/types/core-modules';
import { EventEmitter } from 'events';
import { EventType } from '../../dist/core/structures/enums';
import { CommandInitPlugin, controller } from '../../src';

vi.mock('discord.js', () => {
  const Client = vi.fn()
  Client.prototype.login= vi.fn()
    const Collection = Map;
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
        Client,
        Collection,
        ComponentType: {
            Button: 2,
        },
        InteractionType: {
            Ping: 1,
            ApplicationCommand: 2,
            MessageComponent: 3,
            ApplicationCommandAutocomplete: 4,
            ModalSubmit: 5,
        },
        ApplicationCommandOptionType: {
            Subcommand: 1,
            SubcommandGroup: 2,
            String: 3,
            Integer: 4,
            Boolean: 5,
            User: 6,
            Channel: 7,
            Role: 8,
            Mentionable: 9,
            Number: 10,
            Attachment: 11,
        },
        ApplicationCommandType: {
            ChatInput: 1,
            User: 2,
            Message: 3,
        },
        ModalSubmitInteraction,
        ButtonInteraction,
        AutocompleteInteraction,
    };
})
function createRandomPlugin (s: 'go', mut?: Partial<Module>) {
    return CommandInitPlugin(({ module, updateModule }) => {
        if(mut) {
            updateModule(mut)
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
    it('mutate with init plugins', async () => {
        const deps = mockDeps()
        const plugins = createRandomPlugin('go', { name: "abc" })
        const mod = createRandomModule([plugins])
        const s = await callInitPlugins(mod, deps, false)
        expect(s.name).not.equal(mod.name)
    })

});


