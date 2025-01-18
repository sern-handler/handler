import type { InteractionReplyOptions, MessageReplyOptions } from 'discord.js';
import type { Module } from './core-modules';

export type Awaitable<T> = PromiseLike<T> | T;
export type Dictionary = Record<string, unknown>

export type AnyFunction = (...args: any[]) => unknown;

export interface SernEventsMapping {
    'module.register': [Payload];
    'module.activate': [Payload];
    error: [{ type: 'failure'; module?: Module; reason: string | Error }];
    warning: [Payload];
    modulesLoaded: [never?];
}

export type Payload =
    | { type: 'success'; module: Module }
    | { type: 'failure'; module?: Module; reason: string | Error }
    | { type: 'warning'; module: undefined; reason: string };

export type UnpackFunction<T> = T extends (...args: any) => infer U ? U : T
export type UnpackedDependencies = {
    [K in keyof Dependencies]: UnpackFunction<Dependencies[K]>
}
export type ReplyOptions = string | Omit<InteractionReplyOptions, 'fetchReply'> | MessageReplyOptions;


export interface Wrapper {
    commands: string | string[];
    defaultPrefix?: string;
    events?: string | string[];
    tasks?: string | string[];
}
