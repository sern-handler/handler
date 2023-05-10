import { Container, UnpackFunction } from "iti";
import { Awaitable, ModuleStore } from "../../shared";
import { ErrorHandling, Logging, ModuleManager } from "../contracts";
import { SernEmitter } from "../";
import EventEmitter from "node:events";

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


export type DependencyFromKey<T extends keyof Dependencies> = Dependencies[T]; 
export type IntoDependencies<Tuple extends [...any[]]> = {
  [Index in keyof Tuple]: UnpackFunction<DependencyFromKey<Tuple[Index]>&{}>; //Unpack and make NonNullable
} & { length: Tuple['length'] };

export interface DependencyConfiguration<T extends Dependencies> {
    //@deprecated. Loggers will always be included in the future
    exclude?: Set<'@sern/logger'>;
    build: (root: Container<CoreDependencies, {}>) => Awaitable<Container<T, {}>>;
}

//To be removed in future
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


