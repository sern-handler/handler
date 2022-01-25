import type { Ok, Result } from 'ts-results';
import type { Awaitable, Client, Message, MessagePayload} from 'discord.js';
import type { MessageOptions } from 'child_process';
import type Sern from '../..';

export type Visibility = "private" | "public"
export type possibleOutput = string | MessagePayload & MessageOptions

export type MessagePackage  = {
    message : Message, 
    prefix : string
}
export type delegate = Sern.Module<unknown>["delegate"]

export enum CommandType {
    TEXT  = 0b00000001 << 0b00000001,
    SLASH = 0b00000001 << 0b00000010,
}