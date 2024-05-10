import callsites from 'callsites';
import * as Files from './core/module-loading';
import { Services } from './core/ioc';
import type { DependencyList } from './types/ioc';
interface Wrapper {
    commands?: string;
    defaultPrefix?: string;
    events?: string;
}

const __start = (entryPoint: string,
                 wrapper: { defaultPrefix?: string },
                 dependencies: DependencyList) => {
    //@ts-ignore sern handler generates handler.js
    import(entryPoint)
        .then(({ commands=new Map(), events=new Map() }) => { 
            console.log(commands, events) 
        })
        .catch(err => dependencies[2]?.error({ message: err }));
}
/**
 * @since 1.0.0
 * @param wrapper Options to pass into sern.
 * Function to start the handler up
 * @example
 * ```ts title="src/index.ts"
 * Sern.init()
 * ```
 */
export function init(wrapper: Wrapper) {
    const startTime = performance.now();
    const dependencies = Services('@sern/emitter', 
                                  '@sern/errors',
                                  '@sern/logger',
                                  '@sern/client');

    const initCallsite = callsites()[1].getFileName();
    const handlerModule = Files.shouldHandle(initCallsite!, "handler");
    if(!handlerModule.exists) {
        throw Error("Could not find handler module, did you run sern build?")
    }
    __start(handlerModule.path, wrapper, dependencies);
}

