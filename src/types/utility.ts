import type { InteractionReplyOptions, MessageReplyOptions } from 'discord.js';
import type { PayloadType } from '../core/structures/enums';
import type { Module } from './core-modules';
import type { Result } from 'ts-results-es';

export type Awaitable<T> = PromiseLike<T> | T;

export type VoidResult = Result<void, void>;
export type AnyFunction = (...args: any[]) => unknown;

export interface SernEventsMapping {
    'module.register': [Payload];
    'module.activate': [Payload];
    error: [{ type: PayloadType.Failure; module?: Module; reason: string | Error }];
    warning: [Payload];
    modulesLoaded: [never?];
}

export type Payload =
    | { type: PayloadType.Success; module: Module }
    | { type: PayloadType.Failure; module?: Module; reason: string | Error }
    | { type: PayloadType.Warning; module: undefined; reason: string };

//https://github.com/molszanski/iti/blob/0a3a006113b4176316c308805314a135c0f47902/iti/src/_utils.ts#L29C1-L29C76
export type UnpackFunction<T> = T extends (...args: any) => infer U ? U : T
export type UnpackedDependencies = {
    [K in keyof Dependencies]: UnpackFunction<Dependencies[K]>
}
export type ReplyOptions = string | Omit<InteractionReplyOptions, 'fetchReply'> | MessageReplyOptions;
