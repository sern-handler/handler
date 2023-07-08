import type {
    CommandInteractionOptionResolver,
    InteractionReplyOptions,
    MessageReplyOptions,
} from 'discord.js';
import { PayloadType } from './core';
import { AnyModule } from './core/types/modules';

export type ReplyOptions =
    | string
    | Omit<InteractionReplyOptions, 'fetchReply'>
    | MessageReplyOptions;

export type Payload =
    | { type: PayloadType.Success; module: AnyModule }
    | { type: PayloadType.Failure; module?: AnyModule; reason: string | Error }
    | { type: PayloadType.Warning; reason: string };

export interface SernEventsMapping {
    'module.register': [Payload];
    'module.activate': [Payload];
    error: [Payload];
    warning: [Payload];
    'modulesLoaded': [never?];
}

export type Awaitable<T> = PromiseLike<T> | T;

export interface Wrapper {
    commands: string;
    defaultPrefix?: string;
    events?: string;
    /**
     * Overload to enable mode in case developer does not use a .env file.
     */
    mode?: 'DEV' | 'PROD';
    /*
     * @deprecated
     */
    containerConfig?: {
        get: (...keys: (keyof Dependencies)[]) => unknown[];
    };
}

// Thanks to @kelsny
type ParseType<T> = {
    [K in keyof T]: T[K] extends unknown ? [k: K, args: T[K]] : never;
}[keyof T];

export type Args = ParseType<{ text: string[]; slash: SlashOptions }>;

export type SlashOptions = Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>;


export type AnyFunction = (...args:unknown[]) => unknown
