import { Container, UnpackFunction } from 'iti';
import * as Contracts from '../core/contracts';
/**
  * Type to annotate that something is a singleton. 
  * T is created once and lazily.
  */
export type Singleton<T> = () => T;
/**
  * Type to annotate that something is transient. 
  * Every time this is called, a new object is created
  */
export type Transient<T> = () => () => T;
/**
  * Type to annotate that something is initializable. 
  * If T has an init method, this will be called.
  */
export type Initializable<T extends Contracts.Init> = T

export type DependencyList = [
    Contracts.Emitter&Contracts.Listener,
    Contracts.ErrorHandling,
    Contracts.Logging | undefined,
    Contracts.ModuleManager,
    Contracts.Emitter&Contracts.Listener,
];

export interface CoreDependencies {
    '@sern/client': () => (Contracts.Emitter & Contracts.Listener);
    '@sern/logger'?: () => Contracts.Logging;
    '@sern/emitter': () => (Contracts.Emitter & Contracts.Listener);
    '@sern/store': () => Contracts.CoreModuleStore;
    '@sern/modules': () => Contracts.ModuleManager;
    '@sern/errors': () => Contracts.ErrorHandling;
}

export type DependencyFromKey<T extends keyof Dependencies> = Dependencies[T];

export type IntoDependencies<Tuple extends [...any[]]> = {
    [Index in keyof Tuple]: UnpackFunction<NonNullable<DependencyFromKey<Tuple[Index]>>>; //Unpack and make NonNullable
} & { length: Tuple['length'] };

export interface DependencyConfiguration {
    //@deprecated. Loggers will always be included in the future
    exclude?: Set<'@sern/logger'>;
    build: (
        root: Container<Omit<CoreDependencies, '@sern/client'>, {}>,
    ) => Container<Dependencies, {}>;
}
