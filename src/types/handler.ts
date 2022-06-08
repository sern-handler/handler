import type {
    APIEmbed,
    Awaitable,
    ClientEvents,
    CommandInteractionOptionResolver,
    MessageEditOptions,
    WebhookEditMessageOptions,
} from 'discord.js';
import type { EventEmitter } from 'events';
import type { SernEventsMapping } from '../handler/sernEmitter';
import type { JSONEncodable } from '@discordjs/builders';
export type Nullish<T> = T | undefined | null;

// Thanks to @kelsny
export type ParseType<T> = {
    [K in keyof T]: T[K] extends unknown ? [k: K, args: T[K]] : never;
}[keyof T];

export type Args = ParseType<{ text: string[]; slash: SlashOptions }>;

export type DiscordEvent = ParseType<{
    [K in keyof ClientEvents]: (...args: ClientEvents[K]) => Awaitable<void>;
}>;

export type SernEvent = ParseType<{
    [K in keyof SernEventsMapping]: (...args: SernEventsMapping[K]) => Awaitable<void>;
}>;
export type EventEmitterRegister = [
    emitter: EventEmitter,
    k: string,
    cb: (...args: unknown[]) => Awaitable<void>,
];

export type SlashOptions = Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>;

// Source: https://dev.to/vborodulin/ts-how-to-override-properties-with-type-intersection-554l
export type Override<T1, T2> = Omit<T1, keyof T2> & T2;

export type DefinitelyDefined<T, K extends keyof T> = {
    [L in K]-?: T[L] extends Record<string, unknown>
        ? DefinitelyDefined<T[L], keyof T[L]>
        : Required<T>[L];
} & T;

type Reconstruct<T> = T extends Omit<infer O, infer _> ? O & Reconstruct<O> : T;

type IsOptional<T> = {
    [K in keyof T]-?: T[K] extends Required<T>[K] ? false : true;
};

export type UnionToIntersection<T> = (T extends unknown ? (x: T) => unknown : never) extends (
    x: infer R,
) => unknown
    ? R
    : never;
export type ConformedEditOptions = Override<
    MessageEditOptions | WebhookEditMessageOptions,
    {
        embeds?: (JSONEncodable<APIEmbed> | APIEmbed)[];
    }
>;
