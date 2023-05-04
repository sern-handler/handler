import { makeEventsHandler } from './events/userDefined';
import { makeInteractionCreate } from './events/interactions';
import { makeReadyEvent } from './events/ready';
import { makeMessageCreate } from './events/messages';
import type { AnyDependencies, DependencyConfiguration } from '../types/handler';
import { composeRoot, makeFetcher, useContainer } from '../core/dependencies';
import { err, ok } from '../core/functions';
import { DefaultWrapper } from '../core/structures/wrapper';
import { discordjs } from '../core';
/**
 * @since 1.0.0
 * @param wrapper Options to pass into sern.
 * Function to start the handler up
 * @example
 * ```ts title="src/index.ts"
 * Sern.init({
 *     platform: djs('!'),
 *     commands: 'dist/commands',
 *     events: 'dist/events',
 *     containerConfig : {
 *         get: useContainer
 *     }
 * })
 * ```
 */
export function init(wrapper: DefaultWrapper) {
    const dependenciesAnd = makeFetcher(wrapper.containerConfig);
    const startTime = performance.now();
    const dependencies = dependenciesAnd(['@sern/modules', '@sern/client']);
    if (wrapper.events !== undefined) {
        makeEventsHandler(
            dependenciesAnd(['@sern/client']), wrapper.events, wrapper.containerConfig
        );
    }
    const platform = discordjs(wrapper.defaultPrefix);
    makeReadyEvent(dependencies, wrapper.commands, platform);
    makeMessageCreate(dependencies, platform);
    makeInteractionCreate(dependencies, platform);
    const endTime = performance.now();
    dependencies[2]?.info({ message: `sern : ${(endTime - startTime).toFixed(2)} ms` });
   
}

/**
 * @since 1.0.0
 * The object passed into every plugin to control a command's behavior
 */
export const controller = {
    next: ok,
    stop: err,
};


/**
 * @since 2.0.0
 * @param conf a configuration for creating your project dependencies
 */
export function makeDependencies<const T extends AnyDependencies>(conf: DependencyConfiguration<T>) {
    //Until there are more optional dependencies, just check if the logger exists
    composeRoot(conf);
    return useContainer<T>();
}


