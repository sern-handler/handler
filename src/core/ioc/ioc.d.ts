
type Singleton<T> = () => T;
type Transient<T> = () => () => T;

interface CoreDependencies {
    '@sern/logger'?: Singleton<import('../contracts/logging').Logging>;
    '@sern/emitter': Singleton<import('../structures/sern-emitter').SernEmitter>;
    '@sern/store': Singleton<import('../contracts/module-store').CoreModuleStore>;
    '@sern/modules': Singleton<import('../contracts/module-manager').ModuleManager>;
    '@sern/errors': Singleton<import('../contracts/error-handling').ErrorHandling>;
}

interface Dependencies extends CoreDependencies {
    '@sern/client': Singleton<import('node:events').EventEmitter>;
}

