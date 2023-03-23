import type { CommandInteractionOptionResolver } from 'discord.js';
import type { PayloadType } from '../handler/structures/enums';
import type { InteractionReplyOptions, MessageReplyOptions } from 'discord.js';
import type { EventEmitter } from 'events';
import type { CommandModule, EventModule, AnyModule } from './module';
import type { UnpackFunction } from 'iti';
import type { ErrorHandling, Logging, ModuleManager } from '../handler/contracts';
import type { ModuleStore } from '../handler/structures/moduleStore';
import type SernEmitter from '../handler/sernEmitter';
import type { Container } from 'iti';
// Thanks to @kelsny
export type ParseType<T> = {
    [K in keyof T]: T[K] extends unknown ? [k: K, args: T[K]] : never;
}[keyof T];

export type Args = ParseType<{ text: string[]; slash: SlashOptions }>;

export type SlashOptions = Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>;

/**
 * After modules are transformed, name and description are given default values if none
 * are provided to Module. This type represents that transformation
 */
export type AnyDefinedModule = Processed<CommandModule | EventModule>;
export type Payload =
    | { type: PayloadType.Success; module: AnyModule }
    | { type: PayloadType.Failure; module?: AnyModule; reason: string | Error }
    | { type: PayloadType.Warning; reason: string };
export type SernEventsMapping = {
    'module.register': [Payload];
    'module.activate': [Payload];
    error: [Payload];
    warning: [Payload];
};
export type LogPayload<T = unknown> = { message: T };
export type Singleton<T> = () => T;
export type Transient<T> = () => () => T;

export interface Dependencies {
    '@sern/client': Singleton<EventEmitter>;
    '@sern/logger'?: Singleton<Logging>;
    '@sern/emitter': Singleton<SernEmitter>;
    '@sern/store': Singleton<ModuleStore>;
    '@sern/modules': Singleton<ModuleManager>;
    '@sern/errors': Singleton<ErrorHandling>;
}

export type ReplyOptions =
    | string
    | Omit<InteractionReplyOptions, 'fetchReply'>
    | MessageReplyOptions;
//prettier-ignore
export type MapDeps<Deps extends Dependencies, T extends readonly unknown[]> = T extends [
    infer First extends keyof Deps,
    ...infer Rest extends readonly unknown[],
]
    ? [
          UnpackFunction<Deps[First]>,
          ...(MapDeps<Deps, Rest> extends [never] ? [] : MapDeps<Deps, Rest>),
      ]
    : [never];
//Basically, '@sern/client' | '@sern/store' | '@sern/modules' | '@sern/error' | '@sern/emitter' will be provided defaults, and you can exclude the rest
export type OptionalDependencies = '@sern/logger';
export type Processed<T> = T & { name: string; description: string };
export type Deprecated<Message extends string> = [never, Message];
export interface DependencyConfiguration<T extends Dependencies> {
    exclude?: Set<OptionalDependencies>;
    build: (root: Container<Omit<Dependencies, '@sern/client'>, {}>) => Container<T, {}>;
}

export type ImportPayload<T> =
    | { module: T; absPath: string }
    | { module: undefined; absPath: string };
