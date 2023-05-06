import { type EventEmitter } from "node:events";
import { ErrorHandling, Logging, ModuleManager, SernEmitter } from "../core";
import { Container, UnpackFunction } from "iti";

export type ModuleStore = Map<string,string>
export type ServerlessDependencyList = [ SernEmitter,ErrorHandling, Logging | undefined, ModuleManager];
export type WebsocketDependencyList = [SernEmitter,ErrorHandling, Logging | undefined, ModuleManager, EventEmitter];
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
/**
  * To support older versions. Type alias for WebsocketDependencies
  * @deprecated
  */
export type Dependencies = WebsocketDependencies
export interface ServerlessDependencies extends CoreDependencies {
    '@sern/client': never
}

export interface WebsocketDependencies extends CoreDependencies {
    '@sern/client': Singleton<EventEmitter>;
}
export type AnyDependencies =
    | ServerlessDependencies
    | WebsocketDependencies;

//prettier-ignore
export type MapDeps<Deps extends AnyDependencies, T extends readonly unknown[]> = T extends [
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
export interface DependencyConfiguration<T extends AnyDependencies> {
    exclude?: Set<OptionalDependencies>;
    build: (root: Container<Omit<AnyDependencies, '@sern/client'>, {}>) => Container<T, {}>;
}

export interface ImportPayload<T> {
    module: T;
    absPath: string 
};

export interface Wrapper {
    commands: string;
    defaultPrefix?: string;
    events?: string;
    containerConfig: {
        get: (...keys: (keyof WebsocketDependencies)[]) => unknown[];
    }
}
