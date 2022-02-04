import type { Ok, Result, Option } from 'ts-results';
import type { Awaitable, Client, CommandInteraction, CommandInteractionOptionResolver, Message, MessagePayload} from 'discord.js';
import type { MessageOptions } from 'child_process';
import type { Sern } from '../../handler/sern/sern';

export type Visibility = "private" | "public"
export type possibleOutput = string | MessagePayload & MessageOptions
export type Nullable<T> = T | null;

export type MessagePackage  = {
    message : Option<Message>,
    interaction : Option<CommandInteraction>, 
    prefix : string
}

export type delegate = Sern.Module<unknown>["delegate"]

export enum CommandType {
    TEXT  = 2,
    SLASH = 4,
}

export type Context = {
    text : Option<Message>,
    slash : Option<CommandInteraction>
}
export type ParseType = {
    text : [arg: string];
    slash : [options : Omit<CommandInteractionOptionResolver, "getMessage" | "getFocused">]
};
