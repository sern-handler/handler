import { Wrapper, CommandType, EventType, PluginType } from '../core/structures';
import { DispatchType } from '../core/platform';
import { makeEventsHandler } from './events/userDefinedEventsHandling';
import { AnyEventPlugin, ControlPlugin, InitPlugin, type Plugin } from '../types/plugin';
import { makeInteractionCreate } from './events/interactionHandler';
import { makeReadyEvent } from './events/readyHandler';
import { makeMessageCreate } from './events/messageHandler';
import type {
    CommandModule,
    CommandModuleDefs,
    EventModule,
    EventModuleDefs,
    InputCommand,
    InputEvent,
} from '../types/module';
import type { AnyDependencies, Dependencies, DependencyConfiguration } from '../types/handler';
import { composeRoot, makeFetcher, useContainer } from '../core/dependencies/provider';
import type { Logging } from '../core/contracts';
import { err, ok, partition } from '../core/utilities/functions';
import type { Awaitable, ClientEvents } from 'discord.js';
import { AnyWrapper, isServerless } from '../core/structures/wrapper';
/**
 * @since 1.0.0
 * @param wrapper Options to pass into sern.
 * Function to start the handler up
 * @example
 * ```ts title="src/index.ts"
 * Sern.init({
 *     defaultPrefix: '!',
 *     commands: 'dist/commands',
 *     events: 'dist/events',
 *     containerConfig : {
 *         get: useContainer
 *     }
 * })
 * ```
 */
export function init(wrapper: AnyWrapper) {
    const logger = wrapper.containerConfig.get('@sern/logger')[0] as Logging | undefined;
    const requiredDependenciesAnd = makeFetcher(wrapper);
    const startTime = performance.now();
    if(isServerless(wrapper)) {
                 

    } else {
        const dependencies = requiredDependenciesAnd(['@sern/modules']);
        const { events } = wrapper;
        if (events !== undefined) {
            makeEventsHandler(requiredDependenciesAnd([]), events, wrapper.containerConfig);
        }
        makeReadyEvent(dependencies, wrapper.commands);
        makeMessageCreate(dependencies, wrapper?.defaultPrefix ?? wrapper.platform.defaultPrefix);
        makeInteractionCreate(dependencies);
        const endTime = performance.now();
        logger?.info({ message: `sern : ${(endTime - startTime).toFixed(2)} ms` });
    }
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
 * @since 1.0.0 The wrapper function to define command modules for sern
 * @param mod
 */
export function commandModule(mod: InputCommand): CommandModule {
    const [onEvent, plugins] = partition(
        mod.plugins ?? [],
        el => (el as Plugin).type === PluginType.Control,
    );
    return {
        ...mod,
        onEvent,
        plugins,
    } as CommandModule;
}
/**
 * @since 1.0.0
 * The wrapper function to define event modules for sern
 * @param mod
 */
export function eventModule(mod: InputEvent): EventModule {
    const [onEvent, plugins] = partition(
        mod.plugins ?? [],
        el => (el as Plugin).type === PluginType.Control,
    );
    return {
        ...mod,
        onEvent,
        plugins,
    } as EventModule;
}

/**
 * Create event modules from discord.js client events,
 * This is an {@link eventModule} for discord events,
 * where typings can be very bad.
 * @param mod
 */
export function discordEvent<T extends keyof ClientEvents>(mod: {
    name: T;
    plugins?: AnyEventPlugin[];
    execute: (...args: ClientEvents[T]) => Awaitable<unknown>;
}) {
    return eventModule({ type: EventType.Discord, ...mod });
}
/**
 * @since 2.0.0
 * @param conf a configuration for creating your project dependencies
 */
export function makeDependencies<const T extends AnyDependencies>(conf: DependencyConfiguration<T>) {
    //Until there are more optional dependencies, just check if the logger exists
    composeRoot(conf);
    return useContainer<T>();
}

/**
 * @Experimental
 * Will be refactored / changed in future
 */
export abstract class CommandExecutable<Type extends CommandType> {
    abstract type: Type;
    plugins: InitPlugin[] = [];
    onEvent: ControlPlugin[] = [];
    abstract execute: CommandModuleDefs[Type]['execute'];
}
/**
 * @Experimental
 * Will be refactored in future
 */
export abstract class EventExecutable<Type extends EventType> {
    abstract type: Type;
    plugins: InitPlugin[] = [];
    onEvent: ControlPlugin[] = [];
    abstract execute: EventModuleDefs[Type]['execute'];
}
