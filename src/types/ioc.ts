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
    Contracts.Emitter,
    Contracts.ErrorHandling,
    Contracts.Logging | undefined,
    Contracts.ModuleManager,
    Contracts.Emitter,
];

export interface CoreDependencies {
    '@sern/client': () => Contracts.Emitter;
    '@sern/emitter': () => Contracts.Emitter;
    '@sern/store': () => Contracts.CoreModuleStore;
    '@sern/modules': () => Contracts.ModuleManager;
    '@sern/errors': () => Contracts.ErrorHandling;
    '@sern/logger'?: () => Contracts.Logging;
    '@sern/localizer'?: () => Contracts.Localization
}

export type DependencyFromKey<T extends keyof Dependencies> = Dependencies[T];

export type IntoDependencies<Tuple extends [...any[]]> = {
    [Index in keyof Tuple]: UnpackFunction<NonNullable<DependencyFromKey<Tuple[Index]>>>; //Unpack and make NonNullable
} & { length: Tuple['length'] };

export interface DependencyConfiguration {
    /*
     * @deprecated. Loggers will be opt-in the future
     */
    exclude?: Set<'@sern/logger'>;
    build: (
        root: Container<Omit<CoreDependencies, '@sern/client'>, {}>,
    ) => Container<Dependencies, {}>;
}
