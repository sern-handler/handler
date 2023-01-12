import type Wrapper from './structures/wrapper';
import { processEvents } from './events/userDefinedEventsHandling';
import { CommandType, EventType, PluginType } from './structures/enums';
import type {
    AnyEventPlugin,
    ControlPlugin,
    InitPlugin,
    InputCommand,
    InputEvent,
    Plugin,
} from './plugins/plugin';
import InteractionHandler from './events/interactionHandler';
import ReadyHandler from './events/readyHandler';
import MessageHandler from './events/messageHandler';
import type {
    CommandModule,
    CommandModuleDefs,
    EventModule,
    EventModuleDefs,
} from '../types/module';
import { Container, createContainer } from 'iti';
import type { Dependencies, OptionalDependencies } from '../types/handler';
import { composeRoot, containerSubject, useContainer } from './dependencies/provider';
import type { Logging } from './contracts';
import { err, ok, partition } from './utilities/functions';
import type { Awaitable, ClientEvents } from 'discord.js';

/**
 *
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
export function init(wrapper: Wrapper) {
    const logger = wrapper.containerConfig.get('@sern/logger')[0] as Logging | undefined;
    const startTime = performance.now();
    const { events } = wrapper;
    if (events !== undefined) {
        processEvents(wrapper);
    }
    new ReadyHandler(wrapper);
    new MessageHandler(wrapper);
    new InteractionHandler(wrapper);
    const endTime = performance.now();
    logger?.info({ message: `sern : ${(endTime - startTime).toFixed(2)} ms` });
}

/**
 * The object passed into every plugin to control a command's behavior
 */
export const controller = {
    next: ok,
    stop: err,
};

/**
 * The wrapper function to define command modules for sern
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
 * @param conf a configuration for creating your project dependencies
 */
export function makeDependencies<T extends Dependencies>(conf: {
    exclude?: Set<OptionalDependencies>;
    build: (root: Container<Record<string, any>, {}>) => Container<Partial<T>, T>;
}) {
    const container = conf.build(createContainer());
    composeRoot(container, conf.exclude ?? new Set());
    containerSubject.next(container as unknown as Container<Dependencies, {}>);
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
/**@Experimental
 * Will be refactored in future
 */
export abstract class EventExecutable<Type extends EventType> {
    abstract type: Type;
    plugins: InitPlugin[] = [];
    onEvent: ControlPlugin[] = [];
    abstract execute: EventModuleDefs[Type]['execute'];
}
