//@ts-nocheck
import { expect, test, vi } from 'vitest'
import { CommandType } from '../../src/core/structures/enums';

import * as Id from '../../src/core/id'
import { ButtonInteraction, ModalSubmitInteraction } from 'discord.js';

test('id -> Text', () => {
    expect(Id.create("ping", CommandType.Text)).toBe("ping_T")
})

test('id -> Both', () => {
    expect(Id.create("ping", CommandType.Both)).toBe("ping_B")
})

test('id -> CtxMsg', () => {
    expect(Id.create("ping", CommandType.CtxMsg)).toBe("ping_A3")
})
test('id -> CtxUsr', () => {
    expect(Id.create("ping", CommandType.CtxUser)).toBe("ping_A2")
})
test('id -> Modal', () => {
    expect(Id.create("my-modal", CommandType.Modal)).toBe("my-modal_M");
})

test('id -> Button', () => {
    expect(Id.create("my-button", CommandType.Button)).toBe("my-button_C2");
})

test('id -> Slash', () => {
    expect(Id.create("myslash", CommandType.Slash)).toBe("myslash_A1");
})

test('id -> StringSelect', () => {
    expect(Id.create("mystringselect", CommandType.StringSelect)).toBe("mystringselect_C3");
})

test('id -> UserSelect', () => {
    expect(Id.create("myuserselect", CommandType.UserSelect)).toBe("myuserselect_C5");
})

test('id -> RoleSelect', () => {
    expect(Id.create("myroleselect", CommandType.RoleSelect)).toBe("myroleselect_C6");
})

test('id -> MentionSelect', () => {
    expect(Id.create("mymentionselect", CommandType.MentionableSelect)).toBe("mymentionselect_C7");
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
test('id reconstruct with multiple slashes', () => {
    const idload = Id.reconstruct(new ButtonInteraction("btn//"))
    expect(idload[0].id).toBe("btn_C2")
    expect(idload[0].params).toBe("/")
})


test('id reconstruct button', () => {
    const idload = Id.reconstruct(new ButtonInteraction("btn"))
    expect(idload[0].id).toBe("btn_C2")
    expect(idload[0].params).toBe(undefined)
})



