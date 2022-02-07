import type { Option } from 'ts-results'
import type { CommandInteraction, CommandInteractionOptionResolver, Message, MessagePayload, MessageOptions } from 'discord.js';
import type { Sern } from '../../handler/sern';

export type Visibility = "private" | "public"
//Anything that can be sent in a `<TextChannel>#send` or `<CommandInteraction>#reply`
export type possibleOutput = string | MessagePayload & MessageOptions;
export type Nullable<T> = T | null;

export type delegate = Sern.Module<unknown>["delegate"]

/// Thanks @cursorsdottsx
export type ParseType<T> = {
    [K in keyof T]: T[K] extends unknown ? [k: K, args: T[K]] : never;
}[keyof T];

// A Sern.Module["delegate"] will carry a Context Parameter
export type Context = {
    text: Option<Message>,
    slash: Option<CommandInteraction>
}
export interface Arg {
    text: string;
    slash: SlashOptions
}
// TypeAlias for interaction.options
export type SlashOptions = Omit<CommandInteractionOptionResolver, "getMessage" | "getFocused">;