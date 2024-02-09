import { CommandType } from '../../src/core';
import * as Id from '../../src/core/id'
import { expect, test } from 'vitest'

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



