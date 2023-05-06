import { makeEventsHandler } from './events/userDefined';
import { makeInteractionCreate } from './events/interactions';
import { startReadyEvent } from './events/ready';
import { makeMessageCreate } from './events/messages';
import { makeFetcher, makeDependencies } from '../core/dependencies';
import { err, ok } from '../core/functions';
import { DefaultWrapper } from '../core/structures/wrapper';
import { discordjs } from '../core';
import { getCommands } from '../core/module-loading';
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
    const startTime = performance.now();
    const dependenciesAnd = makeFetcher(wrapper.containerConfig);
    const dependencies = dependenciesAnd(['@sern/modules', '@sern/client']);
    if (wrapper.events !== undefined) {
        makeEventsHandler(
            dependenciesAnd(['@sern/client']), wrapper.events, wrapper.containerConfig
        );
    }
    const platform = discordjs(wrapper.defaultPrefix);
    startReadyEvent(dependencies, getCommands(wrapper.commands), platform);
    makeMessageCreate(dependencies, platform);
    makeInteractionCreate(dependencies, platform);
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
export { makeDependencies }
/**
 * @since 1.0.0
 * The object passed into every plugin to control a command's behavior
 */
export const controller = {
    next: ok,
    stop: err,
};

