import type {
    InteractionReplyOptions,
    MessageReplyOptions,
    CommandInteractionOptionResolver,
} from 'discord.js';
import { Processed } from './core';
import { AnyModule, CommandModule, EventModule } from './module';
import { PayloadType } from '../core';

export type Awaitable<T> = PromiseLike<T> | T;

// Thanks to @kelsny
export type ParseType<T> = {
    [K in keyof T]: T[K] extends unknown ? [k: K, args: T[K]] : never;
}[keyof T];

export type Args = ParseType<{ text: string[]; slash: SlashOptions }>;

export type SlashOptions = Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>;

export type ReplyOptions =
    | string
    | Omit<InteractionReplyOptions, 'fetchReply'>
    | MessageReplyOptions;

export type AnyDefinedModule = Processed<CommandModule | EventModule>;
export type Payload =
    | { type: PayloadType.Success; module: AnyModule }
    | { type: PayloadType.Failure; module?: AnyModule; reason: string | Error }
    | { type: PayloadType.Warning; reason: string };

export interface SernEventsMapping {
    'module.register': [Payload];
    'module.activate': [Payload];
    error: [Payload];
    warning: [Payload];
}
