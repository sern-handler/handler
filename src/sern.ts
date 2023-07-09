import { handleCrash } from './handlers/_internal';
import { err, ok, Files } from './core/_internal';
import { merge } from 'rxjs';
import { Services } from './core/ioc';
import { Wrapper } from './types/core';
import { eventsHandler } from './handlers/user-defined-events';
import { startReadyEvent } from './handlers/ready-event';
import { messageHandler } from './handlers/message-event';
import { interactionHandler } from './handlers/interaction-event';

/**
 * @since 1.0.0
 * @param wrapper Options to pass into sern.
 * Function to start the handler up
 * @example
 * ```ts title="src/index.ts"
 * Sern.init({
 *     commands: 'dist/commands',
 *     events: 'dist/events',
 * })
 * ```
 */

export function init(maybeWrapper: Wrapper | 'file') {
    const startTime = performance.now();
    const wrapper = Files.loadConfig(maybeWrapper);
    const dependencies = useDependencies();
    const logger = dependencies[2],
        errorHandler = dependencies[1];
    const mode = isDevMode(wrapper.mode ?? process.env.MODE);

    if (wrapper.events !== undefined) {
        eventsHandler(dependencies, Files.getFullPathTree(wrapper.events, mode));
    }
    //Ready event: load all modules and when finished, time should be taken and logged
    startReadyEvent(dependencies, Files.getFullPathTree(wrapper.commands, mode)).add(() => {
        const time = ((performance.now() - startTime) / 1000).toFixed(2);
        dependencies[0].emit('modulesLoaded');
        logger?.info({
            message: `sern: registered all modules in ${time} s`,
        });
    });

    const messages$ = messageHandler(dependencies, wrapper.defaultPrefix);
    const interactions$ = interactionHandler(dependencies);
    // listening to the message stream and interaction stream
    merge(messages$, interactions$).pipe(handleCrash(errorHandler, logger)).subscribe();
}

function isDevMode(mode: string | undefined) {
    console.info(`Detected mode: "${mode}"`);
    if (mode === undefined) {
        console.info('No mode found in process.env, assuming DEV');
    }
    return mode === 'DEV' || mode == undefined;
}

function useDependencies() {
    return Services(
        '@sern/emitter',
        '@sern/errors',
        '@sern/logger',
        '@sern/modules',
        '@sern/client',
    );
}

/**
 * @since 1.0.0
 * The object passed into every plugin to control a command's behavior
 */
export const controller = {
    next: ok,
    stop: err,
};
