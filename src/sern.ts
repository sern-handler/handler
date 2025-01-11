//side effect: global container
import { useContainerRaw } from '@sern/ioc/global';

import callsites from 'callsites';
import * as  Files from './core/module-loading';
import eventsHandler from './handlers/user-defined-events';
import ready  from './handlers/ready';
import { interactionHandler } from './handlers/interaction';
import { messageHandler } from './handlers/message'
import { presenceHandler } from './handlers/presence';
import { UnpackedDependencies } from './types/utility';
import type { Presence} from './core/presences';
import { registerTasks } from './handlers/tasks';

interface Wrapper {
    commands: string;
    defaultPrefix?: string;
    events?: string;
    tasks?: string;
}
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
        eventsHandler(deps, maybeWrapper.events)
            .then(() => {
                deps['@sern/logger']?.info({ message: "Events registered" });
            });
    } else {
        deps['@sern/logger']?.info({ message: "No events registered" });
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

    //const messages$ = messageHandler(deps, maybeWrapper.defaultPrefix);
    interactionHandler(deps, maybeWrapper.defaultPrefix);
    messageHandler(deps, maybeWrapper.defaultPrefix)
    // listening to the message stream and interaction stream
    //merge(messages$, interactions$).subscribe();
}
