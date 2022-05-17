/*
 * ---------------------------------------------------------------------
 *  Copyright (C) 2022 Sern
 *  This software is licensed under the MIT License.
 *  See LICENSE.md in the project root for license information.
 * ---------------------------------------------------------------------
 */

import type {
    CommandInteractionOptionResolver,
    MessagePayload,
    MessageOptions,
    ClientEvents,
    Awaitable
} from 'discord.js';

// Anything that can be sent in a `<TextChannel>#send` or `<CommandInteraction>#reply`
export type possibleOutput<T = string> = T | (MessagePayload & MessageOptions);
export type Nullish<T> = T | undefined | null;

// Thanks to @kelsny
export type ParseType<T> = {
    [K in keyof T]: T[K] extends unknown ? [k: K, args: T[K]] : never;
}[keyof T];


export type Args = ParseType<{ text: string[]; slash: SlashOptions }>;

export type DiscordEvent = 
    ParseType< { [K in keyof ClientEvents ] : (...args : ClientEvents[K]) => Awaitable<void> }>;

export type SlashOptions = Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>;

// Source: https://dev.to/vborodulin/ts-how-to-override-properties-with-type-intersection-554l
export type Override<T1, T2> = Omit<T1, keyof T2> & T2;

