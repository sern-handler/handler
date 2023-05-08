import { Container } from 'iti';
import type { Dependencies, DependencyConfiguration, MapDeps, Wrapper } from '../types/core';
import { DefaultErrorHandling, DefaultLogging, DefaultModuleManager } from './contracts';
import { SernEmitter } from './structures';
import { SernError } from './structures/errors';
import * as assert from 'node:assert'
import * as types from 'node:util/types'
import { Awaitable } from '../types/handler';
export let containerSubject: Container<{}, {}>; 
const requiredDependencyKeys = ['@sern/emitter', '@sern/errors', '@sern/logger'] as const;
/**
 * @__PURE__
 * @since 2.0.0.
 * use single if you want a singleton, or an object that is called once.
 * @param cb
 */
export function single<T>(cb: () => T) {
    return cb;
}

/**
 * @__PURE__
 * @since 2.0.0
 * Following iti's singleton and transient implementation,
 * use transient if you want a new dependency every time your container getter is called
 * @param cb
 */
export function transient<T>(cb: () => () => T) {
    return cb;
}
/**
 * Given the user's conf, check for any excluded dependency keys.
 * Then, call conf.build to get the rest of the users' dependencies.
 * Finally, update the containerSubject with the new container state
 * @param conf
 */
export async function composeRoot<T extends Dependencies>(conf: DependencyConfiguration<T>) {
    //container should have no client or logger yet.
    const excludeLogger = conf.exclude?.has('@sern/logger');
    if (!excludeLogger) {
        containerSubject.add({
            '@sern/logger': () => new DefaultLogging(),
        });
    }
    //Build the container based on the callback provided by the user
    const updatedContainer = await conf.build(containerSubject as Container<Omit<Dependencies, '@sern/client'>, {}>);
    try {
        updatedContainer.get('@sern/client');
    } catch {
        throw new Error(SernError.MissingRequired + " No client was provided")
    }

    if (!excludeLogger) {
        updatedContainer.get('@sern/logger')?.info({ message: 'All dependencies loaded successfully.' });
    }
}

export function useContainer<const T extends Dependencies>() {
    console.warn(`Warning: using a container hook is not recommended. Could lead to many unwanted side effects`);
    return <V extends (keyof T)[]>(...keys: [...V]) =>
        keys.map(key => (containerSubject as Container<T, {}>).get(key)) as MapDeps<T, V>;
}

/**
 * Returns the underlying data structure holding all dependencies.
 * Exposes methods from iti
 */
export function useContainerRaw() {
    assert.ok(
        containerSubject && (containerSubject as CoreContainer).isReady(),
        "Could not find container or container wasn't ready. Did you call makeDependencies?"
    );
    return containerSubject;
}

/**
 * @since 2.0.0
 * @param conf a configuration for creating your project dependencies
 */
export async function makeDependencies<const T extends Dependencies>(
    conf: DependencyConfiguration<T>,
) {
    containerSubject = new CoreContainer();
    //Until there are more optional dependencies, just check if the logger exists
    await composeRoot(conf);
    (containerSubject as CoreContainer).ready();
    
    return useContainer<T>();
}

export interface Init {
    init() : Awaitable<unknown>
}

/**
 * Provides all the defaults for sern to function properly.
 * The only user provided dependency needs to be @sern/client
 */
class CoreContainer extends Container<Dependencies, {}> {
    private _ready = false;
    constructor() {
        super();
        (this as Container<{}, {}>)
            .add({
                '@sern/errors': () => new DefaultErrorHandling(),
                '@sern/store': () => new Map<string, string>(),
                '@sern/emitter': () => new SernEmitter()
            })
            .add(ctx => {
                return { '@sern/modules': () => new DefaultModuleManager(ctx['@sern/store']) };
            })
    }

    async withInit<const Keys extends keyof Dependencies>(...keys: Keys[]) {
        if(this.isReady()) {
            throw Error("You cannot call this method after sern has started");
        }
        for await (const k of keys) {
           const dep = this.get(k);
           assert.ok(dep !== undefined);
           if('init' in dep && typeof dep.init === 'function') {
              types.isAsyncFunction(dep.init) 
                ? await dep.init() 
                : dep.init()
           } else {
             throw Error(`called withInit with key ${k} but found nothing to init`) 
           }
        }
        return this;
    }
    isReady() {
        return this._ready;
    }
    ready() {
        this._ready = true;
    }
}


/**
 * A way for sern to grab only the necessary dependencies.
 * Returns a function which allows for the user to call for more dependencies.
 */
export function makeFetcher<Dep extends Dependencies>(
    containerConfig: Wrapper['containerConfig'],
) {
    return <const Keys extends (keyof Dep)[]>(otherKeys: [...Keys]) =>
        containerConfig.get(
            ...requiredDependencyKeys,
            ...(otherKeys as (keyof Dependencies)[]),
        ) as MapDeps<Dep, [...typeof requiredDependencyKeys, ...Keys]>;
}
