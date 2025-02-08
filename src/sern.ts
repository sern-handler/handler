//side effect: global container
import { useContainerRaw } from '@sern/ioc/global';
// set asynchronous capturing of errors
import events from 'node:events'
events.captureRejections = true;

import callsites from 'callsites';
import * as  Files from './core/module-loading';
import eventsHandler from './handlers/user-defined-events';
import ready  from './handlers/ready';
import { interactionHandler } from './handlers/interaction';
import { messageHandler } from './handlers/message'
import { presenceHandler } from './handlers/presence';
import type { Payload, UnpackedDependencies, Wrapper } from './types/utility';
import type { Presence} from './core/presences';
import { registerTasks } from './handlers/tasks';
import { addCleanupListener } from './cleanup';


/**
 * @since 1.0.0
 * @param maybeWrapper Options to pass into sern.
 * Function to start the handler up
 * @example
 * ```ts title="src/index.ts"
 * Sern.init({
 *     commands: 'dist/commands',
 *     events: 'dist/events',
 * })
 * ```
 */

export function init(maybeWrapper: Wrapper = { commands: "./dist/commands" }) {
    const startTime = performance.now();
    const deps = useContainerRaw().deps<UnpackedDependencies>();
    if (maybeWrapper.events !== undefined) {
        eventsHandler(deps, maybeWrapper)
            .then(() => {
                deps['@sern/logger']?.info({ message: "Events registered" });
            });
    } else {
        deps['@sern/logger']?.info({ message: "No events registered" });
    }

    // autohandle errors that occur in modules.
    // convenient for rapid iteration
    if(maybeWrapper.handleModuleErrors) {
        if(!deps['@sern/logger']) {
            throw Error('A logger is required to handleModuleErrors.\n A default logger is already supplied!');
        }
        deps['@sern/logger']?.info({ 'message': 'handleModuleErrors enabled' })
        deps['@sern/emitter'].addListener('error', (payload: Payload) => {
            if(payload.type === 'failure') {
                deps['@sern/logger']?.error({ message: payload.reason })
            } else {
                deps['@sern/logger']?.warning({ message: "error event should only have payloads of 'failure'" });
            }
        })
    }

    const initCallsite = callsites()[1].getFileName();
    const presencePath = Files.shouldHandle(initCallsite!, "presence");
    //Ready event: load all modules and when finished, time should be taken and logged
    ready(maybeWrapper.commands, deps)
        .then(() => {
            const time = ((performance.now() - startTime) / 1000).toFixed(2);
            deps['@sern/logger']?.info({ message: `sern: registered in ${time} s` });
            if(presencePath.exists) {
                const setPresence = async (p: Presence.Result) => {
                    return deps['@sern/client'].user?.setPresence(p);
                }
                presenceHandler(presencePath.path, setPresence);
            }
            if(maybeWrapper.tasks) {
                registerTasks(maybeWrapper.tasks, deps);
            }
        })
        .catch(err => { throw err });
    interactionHandler(deps, maybeWrapper.defaultPrefix);
    messageHandler(deps, maybeWrapper.defaultPrefix);

    addCleanupListener(async () => {
        const duration = ((performance.now() - startTime) / 1000).toFixed(2)
        deps['@sern/logger']?.info({ 'message': 'sern is shutting down after '+duration +" seconds" })
        await useContainerRaw().disposeAll();
    });
    
}
