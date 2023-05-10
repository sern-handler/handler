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
 *     containerConfig : {
 *         get: useContainer
 *     }
 * })
 * ```
 */

export function init(wrapper: Wrapper) {
    const startTime = performance.now();

    const dependencies = useDependencies();

    if (wrapper.events !== undefined) {
        makeEventsHandler(
            dependencies,
            getFullPathTree(wrapper.events),
        );
    }

    startReadyEvent(dependencies, getFullPathTree(wrapper.commands)).add(() => console.log('ready'));

    const logger = dependencies[2];
    const errorHandler = dependencies[1];

    const messages$ = makeMessageHandler(dependencies, wrapper.defaultPrefix);
    const interactions$ = makeInteractionHandler(dependencies);

    merge(
        messages$,
        interactions$
    ).pipe(
        catchError(handleError(errorHandler, logger)),
        finalize(() => {
            logger?.info({ message: 'A stream closed or reached end of lifetime' });
            useContainerRaw()
                ?.disposeAll()
                .then(() => logger?.info({ message: 'Cleaning container and crashing' }));
        })
    ).subscribe();

    const endTime = performance.now();
    logger?.info({ message: `sern : ${(endTime - startTime).toFixed(2)} ms` });
}


function useDependencies() {
    return Services(
        '@sern/emitter',
        '@sern/errors',
        '@sern/logger',
        '@sern/modules',
        '@sern/client'
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
