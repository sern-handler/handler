import type { CommandInteractionOptionResolver } from 'discord.js';
import type { PayloadType } from '../handler/structures/enums';
import type { CommandModule, EventModule, Module } from './module';
export type Nullish<T> = T | undefined | null;

// Thanks to @kelsny
export type ParseType<T> = {
    [K in keyof T]: T[K] extends unknown ? [k: K, args: T[K]] : never;
}[keyof T];

export type Args = ParseType<{ text: string[]; slash: SlashOptions }>;

export type SlashOptions = Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>;

// Source: https://dev.to/vborodulin/ts-how-to-override-properties-with-type-intersection-554l
export type Override<T1, T2> = Omit<T1, keyof T2> & T2;

export type DefinitelyDefined<T, K extends keyof T = keyof T> = {
    [L in K]-?: T[L] extends Record<string, unknown>
        ? DefinitelyDefined<T[L], keyof T[L]>
        : Required<T>[L];
} & T;

export type EventInput =
    | string
    | { mod: EventModule; absPath: string }[]
    | (() => { mod: EventModule; absPath: string }[]);


/**
 * Turns a function with a union of array of args into a single union
 *  [ T , V , B ] | [ A ] => T | V | B | A
 */
export type SpreadParams<T extends (...args: never) => unknown> = (
    args: Parameters<T>[number],
) => unknown;

/**
 * After modules are transformed, name and description are given default values if none
 * are provided to Module. This type represents that transformation
 */
export type DefinedCommandModule = DefinitelyDefined<CommandModule, 'name' | 'description'>;
export type DefinedEventModule = DefinitelyDefined<EventModule, 'name' | 'description'>;
export type Payload =
    | { type: PayloadType.Success; module: Module }
    | { type: PayloadType.Failure; module?: Module; reason: string | Error };
export type SernEventsMapping = {
    ['module.register']: [Payload];
    ['module.activate']: [Payload];
    ['error']: [Payload];
    ['warning']: [string];
};

export interface RequiredDependencies {
    ['@sern/client'] : EventEmitter;
}
export type ReplyOptions =
    | string
    | Omit<InteractionReplyOptions, 'fetchReply'>
    | MessageReplyOptions;
