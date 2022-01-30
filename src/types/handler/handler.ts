import type { Ok, Result } from 'ts-results';
import type { Awaitable, Client, Message, MessagePayload} from 'discord.js';
import type { MessageOptions } from 'child_process';
import type { Sern } from '../../handler/sern/sern';

export type Visibility = "private" | "public"
export type possibleOutput = string | MessagePayload & MessageOptions

export type MessagePackage  = {
    message : Message, 
    prefix : string
}
export type delegate = Sern.Module<unknown>["delegate"]

export enum CommandType {
    TEXT  = 1 << 1,
    SLASH = 1 << 2,
}