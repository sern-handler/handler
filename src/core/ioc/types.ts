import { EventEmitter } from 'node:events';
import { Container, UnpackFunction } from 'iti';
export type Singleton<T> = () => T;
export type Transient<T> = () => () => T;

export interface CoreDependencies {
    '@sern/client': () => EventEmitter
    '@sern/logger'?: () => import('../contracts').Logging;
    '@sern/emitter': () => import('../structures/sern-emitter').SernEmitter;
    '@sern/store': () => import('../contracts').CoreModuleStore;
    '@sern/modules': () => import('../contracts').ModuleManager;
    '@sern/errors': () => import('../contracts').ErrorHandling;
}

export type DependencyFromKey<T extends keyof Dependencies> = Dependencies[T];

export type IntoDependencies<Tuple extends [...any[]]> = {
    [Index in keyof Tuple]: UnpackFunction<DependencyFromKey<Tuple[Index]> & {}>; //Unpack and make NonNullable
} & { length: Tuple['length'] };

export interface DependencyConfiguration {
    //@deprecated. Loggers will always be included in the future
    exclude?: Set<'@sern/logger'>;
    build: (root: Container<Omit<CoreDependencies, '@sern/client'>, {}>) => Container<Dependencies, {}>;
}

