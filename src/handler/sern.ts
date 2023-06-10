import { makeEventsHandler } from './events/user-defined';
import { makeInteractionHandler } from './events/interactions';
import { startReadyEvent } from './events/ready';
import { makeMessageHandler } from './events/messages';
import { err, ok } from '../core/functions';
import { getFullPathTree } from '../core/module-loading';
import { merge } from 'rxjs';
import { Services } from '../core/ioc';
import { Wrapper } from '../shared';
import { handleCrash } from './events/generic';

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

export function init(wrapper: Wrapper) {
    const startTime = performance.now();

    const dependencies = useDependencies();
    const logger = dependencies[2];
    const errorHandler = dependencies[1];
    const mode = isDevMode(wrapper.mode ?? process.env.MODE);

    if (wrapper.events !== undefined) {
        makeEventsHandler(dependencies, getFullPathTree(wrapper.events, mode));
    }

    startReadyEvent(dependencies, getFullPathTree(wrapper.commands, mode))
    .add(() => {
        const time = ((performance.now() - startTime) / 1000).toFixed(2);
        dependencies[0].emit('modulesLoaded');
        logger?.info({
            message: `sern: registered all modules in ${time} s`,
        });
    });

    const messages$ = makeMessageHandler(dependencies, wrapper.defaultPrefix);
    const interactions$ = makeInteractionHandler(dependencies);

    merge(messages$, interactions$)
        .pipe(handleCrash(errorHandler, logger))
        .subscribe();
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
