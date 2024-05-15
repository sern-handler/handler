import callsites from 'callsites';
import * as  Files from './core/module-loading';
import { merge } from 'rxjs';
import { Services } from './core/ioc';
import eventsHandler from './handlers/user-defined-events';
import ready  from './handlers/ready';
import { messageHandler } from './handlers/message';
import { interactionHandler } from './handlers/interaction';
import { presenceHandler } from './handlers/presence';
import { Client } from 'discord.js';
import { handleCrash } from './handlers/event-utils';

interface Wrapper {
    commands: string;
    defaultPrefix?: string;
    events: string;
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
export function init(maybeWrapper: Wrapper = { commands: "./dist/commands", events: "./dist/events" }) {
    const startTime = performance.now();
    const dependencies = Services('@sern/emitter', 
                                  '@sern/errors',
                                  '@sern/logger',
                                  '@sern/client',
                                  '@sern/modules');
    const logger = dependencies[2],
          errorHandler = dependencies[1];
    
    if (maybeWrapper.events !== undefined) {
        eventsHandler(dependencies, maybeWrapper.events);
    }

    const initCallsite = callsites()[1].getFileName();
    const presencePath = Files.shouldHandle(initCallsite!, "presence");
    //Ready event: load all modules and when finished, time should be taken and logged
    ready(maybeWrapper.commands, dependencies)
        .then(() => {
            const time = ((performance.now() - startTime) / 1000).toFixed(2);
            logger?.info({ message: `sern: registered in ${time} s`, });
            if(presencePath.exists) {
                const setPresence = async (p: any) => {
                    //@ts-ignore
                    return (dependencies[3] as Client).user?.setPresence(p);
                }
                presenceHandler(presencePath.path, setPresence).subscribe();
            }
        })
        .catch(err => { throw err });

    const messages$ = messageHandler(dependencies, maybeWrapper.defaultPrefix);
    const interactions$ = interactionHandler(dependencies);
    // listening to the message stream and interaction stream
    merge(messages$, interactions$).pipe(handleCrash(errorHandler, dependencies[0], logger)).subscribe();
}
