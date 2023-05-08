import { makeEventsHandler } from './events/user-defined';
import { makeInteractionHandler } from './events/interactions';
import { startReadyEvent } from './events/ready';
import { makeMessageHandler } from './events/messages';
import { makeFetcher, makeDependencies, useContainerRaw } from '../core/dependencies';
import { err, ok } from '../core/functions';
import { Wrapper } from '../types/core';
import { getCommands } from '../core/module-loading';
import { catchError, finalize, merge } from 'rxjs';
import { handleError } from '../core/contracts/error-handling';
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
    const dependenciesAnd = makeFetcher(wrapper.containerConfig);
    const dependencies = dependenciesAnd(['@sern/modules', '@sern/client']);

    if (wrapper.events !== undefined) {
        makeEventsHandler(
            dependenciesAnd(['@sern/client']),
            wrapper.events,
            wrapper.containerConfig,
        );
    }

    startReadyEvent(dependencies, getCommands(wrapper.commands)).add(() => console.log('ready'));

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
            logger?.info({ message: 'a stream closed or reached end of lifetime' });
            useContainerRaw()
                ?.disposeAll()
                .then(() => logger?.info({ message: 'Cleaning container and crashing' }));
        })
    ).subscribe()

    const endTime = performance.now();
    dependencies[2]?.info({ message: `sern : ${(endTime - startTime).toFixed(2)} ms` });
}



/**
 * @deprecated - Please import the function directly:
 * ```ts
 * import { makeDependencies } from '@sern/handler'
 *
 * ```
 */
export { makeDependencies };
/**
 * @since 1.0.0
 * The object passed into every plugin to control a command's behavior
 */
export const controller = {
    next: ok,
    stop: err,
};
