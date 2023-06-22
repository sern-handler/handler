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
import { createRequire } from 'node:module';
import path from 'node:path';

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

export function init(maybeWrapper: Wrapper | 'file') {
    const startTime = performance.now();
    const wrapper = loadConfig(maybeWrapper);
    const dependencies = useDependencies();
    const logger = dependencies[2], errorHandler = dependencies[1];
    const mode = isDevMode(wrapper.mode ?? process.env.MODE);

    if (wrapper.events !== undefined) {
        makeEventsHandler(dependencies, getFullPathTree(wrapper.events, mode));
    }
    //Ready event: load all modules and when finished, time should be taken and logged
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
    // listening to the message stream and interaction stream
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

function loadConfig(wrapper: Wrapper | 'file'): Wrapper {
    if(wrapper === 'file') {
       console.log('Experimental loading of sern.config.json');
       const requir = createRequire(import.meta.url);
       const config = requir(path.resolve('sern.config.json')) as {
           language: string,
           defaultPrefix?: string,
           mode?: 'PROD'| 'DEV'
           paths: {
               base: string;
               commands: string,
               events?: string  
           } 
       };
       const makePath = (dir: keyof typeof config.paths) => 
        config.language === 'typescript' 
            ? path.join('dist', config.paths[dir]!)
            : path.join(config.paths[dir]!);

       console.log('Loading config: ', config);
       const commandsPath = makePath('commands');

       console.log('Commands path is set to', commandsPath);
       let eventsPath: string|undefined;
       if(config.paths.events) {
           eventsPath = makePath('events');
           console.log('Events path is set to', eventsPath);
       }
       return {
          defaultPrefix: config.defaultPrefix,
          commands: commandsPath,
          events: eventsPath,
          mode : config.mode
       };
    }
    return wrapper;
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
