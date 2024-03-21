import type { CommandInteractionOptionResolver, InteractionReplyOptions, MessageReplyOptions } from 'discord.js';
import type { PayloadType } from '../core';
import type { AnyModule } from './core-modules';

export type Awaitable<T> = PromiseLike<T> | T;

export type AnyFunction = (...args: unknown[]) => unknown;

// Thanks to @kelsny
type ParseType<T> = {
    [K in keyof T]: T[K] extends unknown ? [k: K, args: T[K]] : never;
}[keyof T];

export type SlashOptions = Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>;

export type Args = ParseType<{ text: string[]; slash: SlashOptions }>;

export interface SernEventsMapping {
    'module.register': [Payload];
    'module.activate': [Payload];
    error: [{ type: PayloadType.Failure; module?: AnyModule; reason: string | Error }];
    warning: [Payload];
    modulesLoaded: [never?];
}

export type Payload =
    | { type: PayloadType.Success; module: AnyModule }
    | { type: PayloadType.Failure; module?: AnyModule; reason: string | Error }
    | { type: PayloadType.Warning; module: undefined; reason: string };


export type ReplyOptions = string | Omit<InteractionReplyOptions, 'fetchReply'> | MessageReplyOptions;
