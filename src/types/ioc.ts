import { Container, UnpackFunction } from 'iti';
import * as Contracts from '../core/interfaces';
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

export type DependencyList = [
    Contracts.Emitter,
    Contracts.ErrorHandling,
    Contracts.Logging | undefined,
    null,
    Contracts.Emitter,
];

export interface CoreDependencies {
    '@sern/client': () => Contracts.Emitter;
    '@sern/emitter': () => Contracts.Emitter;
    '@sern/errors': () => Contracts.ErrorHandling;
    '@sern/logger'?: () => Contracts.Logging;
}

export type DependencyFromKey<T extends keyof Dependencies> = Dependencies[T];

export type IntoDependencies<Tuple extends [...any[]]> = {
    [Index in keyof Tuple]: UnpackFunction<NonNullable<DependencyFromKey<Tuple[Index]>>>; //Unpack and make NonNullable
} & { length: Tuple['length'] };

/**
  * @deprecated This old signature will be incompatible with future versions of sern.
  */
export interface DependencyConfiguration {
    /*
     * @deprecated. Loggers will be opt-in the future
     */
    exclude?: Set<'@sern/logger'>;
    build: (
        root: Container<Omit<CoreDependencies, '@sern/client'>, {}>,
    ) => Container<Dependencies, {}>;
}
