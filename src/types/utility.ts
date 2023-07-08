import { CommandInteractionOptionResolver } from "discord.js";

export type Awaitable<T> = PromiseLike<T> | T;

export type AnyFunction = (...args:unknown[]) => unknown

// Thanks to @kelsny
type ParseType<T> = {
    [K in keyof T]: T[K] extends unknown ? [k: K, args: T[K]] : never;
}[keyof T];


export type SlashOptions = Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>;

export type Args = ParseType<{ text: string[]; slash: SlashOptions }>;

