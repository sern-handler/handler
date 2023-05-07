/**
 * Core typings.
 * Includes iti, dependencies, and other commonly used types
 * Should not have discord.js imports
 */
import { type EventEmitter } from 'node:events';
import { ErrorHandling, Logging, ModuleManager, SernEmitter } from '../core';
import { Container, UnpackFunction } from 'iti';
import { Module } from './module';
import { Awaitable } from './handler';

export type ModuleStore = Map<string, string>;
export type DependencyList = [
    SernEmitter,
    ErrorHandling,
    Logging | undefined,
    ModuleManager,
    EventEmitter,
];
/**
 * After modules are transformed, name and description are given default values if none
 * are provided to Module. This type represents that transformation
 */

export type LogPayload<T = unknown> = { message: T };
export type Singleton<T> = () => T;
export type Transient<T> = () => () => T;

export interface CoreDependencies {
    '@sern/logger'?: Singleton<Logging>;
    '@sern/emitter': Singleton<SernEmitter>;
    '@sern/store': Singleton<ModuleStore>;
    '@sern/modules': Singleton<ModuleManager>;
    '@sern/errors': Singleton<ErrorHandling>;
}

export interface Dependencies extends CoreDependencies {
    '@sern/client': Singleton<EventEmitter>;
}

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

/*
 * @deprecated  
 * Will remove optional logger in the future
 */export type OptionalDependencies = '@sern/logger';
export type Processed<T> = T & { name: string; description: string };
export type Deprecated<Message extends string> = [never, Message];
export interface DependencyConfiguration<T extends Dependencies> {
    //@deprecated. Loggers will always be included in the future
    exclude?: Set<OptionalDependencies>;
    build: (root: Container<CoreDependencies, {}>) => Awaitable<Container<T, {}>>;
}

export interface ImportPayload<T> {
    module: T;
    absPath: string;
}

export interface Wrapper {
    commands: string;
    defaultPrefix?: string;
    events?: string;
    containerConfig: {
        get: (...keys: (keyof Dependencies)[]) => unknown[];
    };
}
export interface InitArgs<T extends Processed<Module>> {
    module: T;
    absPath: string;
}
