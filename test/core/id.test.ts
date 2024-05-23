//@ts-nocheck
import { expect, test, vi } from 'vitest'
import { CommandType } from '../../src/core/structures/enums';

import * as Id from '../../src/core/id'
import { ButtonInteraction, ModalSubmitInteraction } from 'discord.js';
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
        Collection: mod.Collection,
        ComponentType: mod.ComponentType,
        InteractionType: mod.InteractionType,
        ApplicationCommandOptionType: mod.ApplicationCommandOptionType,
        ApplicationCommandType: mod.ApplicationCommandType, 
        ModalSubmitInteraction,
        ButtonInteraction,
        AutocompleteInteraction,
    };
});
test('id -> Text', () => {
    const bothCmdId = Id.create("ping", CommandType.Text)
    expect(bothCmdId).toBe("ping_T")
})

test('id -> Both', () => {
    const bothCmdId = Id.create("ping", CommandType.Both)
    expect(bothCmdId).toBe("ping_B")
})

test('id -> CtxMsg', () => {
    const bothCmdId = Id.create("ping", CommandType.CtxMsg)
    expect(bothCmdId).toBe("ping_A3")
})
test('id -> CtxUsr', () => {
    const bothCmdId = Id.create("ping", CommandType.CtxUser)
    expect(bothCmdId).toBe("ping_A2")
})
test('id -> Modal', () => {
    const modal = Id.create("my-modal", CommandType.Modal)
    expect(modal).toBe("my-modal_M");
})

test('id -> Button', () => {
    const modal = Id.create("my-button", CommandType.Button)
    expect(modal).toBe("my-button_C2");
})

test('id -> Slash', () => {
    const modal = Id.create("myslash", CommandType.Slash)
    expect(modal).toBe("myslash_A1");
})

test('id -> StringSelect', () => {
    const modal = Id.create("mystringselect", CommandType.StringSelect)
    expect(modal).toBe("mystringselect_C3");
})

test('id -> UserSelect', () => {
    const modal = Id.create("myuserselect", CommandType.UserSelect)
    expect(modal).toBe("myuserselect_C5");
})

test('id -> RoleSelect', () => {
    const modal = Id.create("myroleselect", CommandType.RoleSelect)
    expect(modal).toBe("myroleselect_C6");
})

test('id -> MentionSelect', () => {
    const modal = Id.create("mymentionselect", CommandType.MentionableSelect)
    expect(modal).toBe("mymentionselect_C7");
})

test('id -> ChannelSelect', () => {
    const modal = Id.create("mychannelselect", CommandType.ChannelSelect)
    expect(modal).toBe("mychannelselect_C8");
})

test('id reconstruct button', () => {
    const idload = Id.reconstruct(new ButtonInteraction("btn"))
    expect(idload[0].id).toBe("btn_C2")
})

test('id reconstruct button with params', () => {
    const idload = Id.reconstruct(new ButtonInteraction("btn/asdf"))
    expect(idload[0].id).toBe("btn_C2")
    expect(idload[0].params).toBe("asdf")
})
test('id reconstruct modal with params', () => {
    const idload = Id.reconstruct(new ModalSubmitInteraction("btn/asdf"))
    expect(idload[0].id).toBe("btn_M")
    expect(idload[0].params).toBe("asdf")
})
test('id reconstruct modal', () => {
    const idload = Id.reconstruct(new ModalSubmitInteraction("btn"))
    expect(idload[0].id).toBe("btn_M")
    expect(idload[0].params).toBe(undefined)
})
test('id reconstruct button with empty params', () => {
    const idload = Id.reconstruct(new ButtonInteraction("btn/"))
    expect(idload[0].id).toBe("btn_C2")
    expect(idload[0].params).toBe("")
})

test('id reconstruct button', () => {
    const idload = Id.reconstruct(new ButtonInteraction("btn"))
    expect(idload[0].id).toBe("btn_C2")
    expect(idload[0].params).toBe(undefined)
})



