import callsites from 'callsites';
import * as Files from './core/module-loading';
import { Services } from './core/ioc';



interface Wrapper {
    commands?: string;
    defaultPrefix?: string;
    events?: string;
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
        throw Error("Cannot locate handler file. Did you run sern build?");
    }
    import(handlerModule.path)
        .then(({ start }) => start(initCallsite, wrapper))
        .catch(err => dependencies[2].error({ message: err }))
}
