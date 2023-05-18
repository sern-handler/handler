import { Container, UnpackFunction } from 'iti';
import * as Contract from '../contracts';
export type Singleton<T> = () => T;
export type Transient<T> = () => () => T;

export interface CoreDependencies {
    '@sern/logger'?: Singleton<Contract.Logging>;
    '@sern/emitter': Singleton<import('../structures/sern-emitter').SernEmitter>;
    '@sern/store': Singleton<Contract.CoreModuleStore>;
    '@sern/modules': Singleton<Contract.ModuleManager>;
    '@sern/errors': Singleton<Contract.ErrorHandling>;
}

export interface Dependencies extends CoreDependencies {
    '@sern/client': Singleton<import('node:events').EventEmitter>;
}
export type DependencyFromKey<T extends keyof Dependencies> = Dependencies[T];

export type IntoDependencies<Tuple extends [...any[]]> = {
    [Index in keyof Tuple]: UnpackFunction<DependencyFromKey<Tuple[Index]> & {}>; //Unpack and make NonNullable
} & { length: Tuple['length'] };

export interface DependencyConfiguration {
    //@deprecated. Loggers will always be included in the future
    exclude?: Set<'@sern/logger'>;
    build: (root: Container<CoreDependencies, {}>) => Container<Dependencies, {}>;
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
