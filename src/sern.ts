import callsites from 'callsites';
import * as  Files from './core/module-loading';
import { merge } from 'rxjs';
import eventsHandler from './handlers/user-defined-events';
import ready  from './handlers/ready';
import messageHandler from './handlers/message';
import interactionHandler from './handlers/interaction';
import { presenceHandler } from './handlers/presence';
import { handleCrash } from './handlers/event-utils';
import { useContainerRaw } from './core/ioc/global';
import { UnpackedDependencies } from './types/utility';

interface Wrapper {
    commands: string;
    defaultPrefix?: string;
    events?: string;
}
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
                const setPresence = async (p: any) => {
                    return deps['@sern/client'].user?.setPresence(p);
                }
                presenceHandler(presencePath.path, setPresence).subscribe();
            }
        })
        .catch(err => { throw err });

    const messages$ = messageHandler(deps, maybeWrapper.defaultPrefix);
    const interactions$ = interactionHandler(deps, maybeWrapper.defaultPrefix);
    // listening to the message stream and interaction stream
    merge(messages$, interactions$).pipe(handleCrash(deps)).subscribe();
}
