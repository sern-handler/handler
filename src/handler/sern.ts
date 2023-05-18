import { makeEventsHandler } from './events/user-defined';
import { makeInteractionHandler } from './events/interactions';
import { startReadyEvent } from './events/ready';
import { makeMessageHandler } from './events/messages';
import { err, ok } from '../core/functions';
import { getFullPathTree } from '../core/module-loading';
import { catchError, finalize, merge } from 'rxjs';
import { handleError } from '../core/operators';
import { Services, useContainerRaw } from '../core/ioc';
import { Wrapper } from '../shared';

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
    const mode = debugModuleLoading(wrapper.mode ?? process.env.MODE);

    if (wrapper.events !== undefined) {
        makeEventsHandler(dependencies, getFullPathTree(wrapper.events, mode));
    }

    startReadyEvent(dependencies, getFullPathTree(wrapper.commands, mode)).add(() => {
        const time = ((performance.now() - startTime) / 1000).toFixed(2);
        logger?.info({
            message: `sern: registered all modules in ${time} s`,
        });
    });

    const messages$ = makeMessageHandler(dependencies, wrapper.defaultPrefix);
    const interactions$ = makeInteractionHandler(dependencies);

    merge(messages$, interactions$)
        .pipe(
            catchError(handleError(errorHandler, logger)),
            finalize(() => {
                logger?.info({ message: 'A stream closed or reached end of lifetime' });
                useContainerRaw()
                    ?.disposeAll()
                    .then(() => logger?.info({ message: 'Cleaning container and crashing' }));
            }),
        )
        .subscribe();
}

function debugModuleLoading(mode: string | undefined) {
    console.info(`Detected mode: "${mode}"`);
    if (mode === undefined) {
        console.info('No mode found in process.env, assuming DEV');
    }
    switch (mode) {
        case 'PROD':
            return false;
        case 'DEV':
        case undefined:
            return true;
        default: {
            console.warn(mode + ' is not a valid. Should be PROD or DEV');
            return false;
        }
    }
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
