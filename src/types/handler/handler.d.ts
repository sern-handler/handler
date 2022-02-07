import type { Option } from 'ts-results';
import type { CommandInteraction, CommandInteractionOptionResolver, Message, MessagePayload} from 'discord.js';
import type { MessageOptions } from 'child_process';
import type { Sern } from '../../handler/sern';

export type Visibility = "private" | "public"
export type possibleOutput = string | MessagePayload & MessageOptions
export type Nullable<T> = T | null;

export type delegate = Sern.Module<unknown>["delegate"]


/// Thanks @cursorsdottsx
export type ParseType<T> = {
    [K in keyof T] : T[K] extends unknown ? [k : K, args: T[K] ] : never;
}[keyof T];

export type Context = {
    text : Option<Message>,
    slash : Option<CommandInteraction>
}
export interface Arg {
    text : string;
    slash : SlashOptions
};

export type SlashOptions =  Omit<CommandInteractionOptionResolver, "getMessage" | "getFocused">;