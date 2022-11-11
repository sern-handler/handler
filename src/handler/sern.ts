import type Wrapper from './structures/wrapper';
import { processEvents } from './events/userDefinedEventsHandling';
import { CommandType, EventType, PluginType } from './structures/enums';
import type {
    CommandPlugin,
    EventModuleCommandPluginDefs,
    EventModuleEventPluginDefs,
    EventPlugin,
    InputCommandModule,
    InputEventModule,
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
import { createContainer, Container } from 'iti';
import type {
    Dependencies
} from '../types/handler';
import { containerSubject, composeRoot, useContainer } from './dependencies/provider';
import type { Logging } from './contracts';
import { err, ok } from './utilities/functions';

/**
 *
 * @param wrapper Options to pass into sern.
 * Function to start the handler up
 * @example
 * ```ts title="src/index.ts"
 * Sern.init({
 *     client,
 *     defaultPrefix: '!',
 *     commands: 'dist/commands',
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
    logger?.info({ message: `sern loaded in ${startTime-endTime}` , date: new Date() });
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
export function commandModule(mod: InputCommandModule): CommandModule {
    const onEvent: EventPlugin[] = [];
    const plugins: CommandPlugin[] = [];
    for (const pl of mod.plugins ?? []) {
        if (pl.type === PluginType.Event) {
            onEvent.push(pl);
        } else {
            plugins.push(pl as CommandPlugin);
        }
    }

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
export function eventModule(mod: InputEventModule): EventModule {
    const onEvent: EventModuleEventPluginDefs[EventType][] = [];
    const plugins: EventModuleCommandPluginDefs[EventType][] = [];
        return {
        ...mod,
        onEvent,
        plugins,
    } as EventModule;
}

/**
 * @param conf a configuration for creating your project dependencies
 */
export function makeDependencies<T extends Dependencies>(conf: {
    exclude?: Set<Exclude<keyof Dependencies, '@sern/client' | '@sern/store' | '@sern/modules' | '@sern/error'>>,
    build: (root: Container<Record<string, unknown>, {}>) => Container<Partial<T>, {}>,
}) {
    const container = conf.build(createContainer());
    composeRoot(container, conf.exclude ?? new Set());
    containerSubject.next(container as unknown as Container<Dependencies, {}>);
    return useContainer<T>();
}

export abstract class CommandExecutable<Type extends CommandType> {
    abstract type: Type;
    plugins: CommandPlugin<Type>[] = [];
    onEvent: EventPlugin<Type>[] = [];
    abstract execute: CommandModuleDefs[Type]['execute'];
}

export abstract class EventExecutable<Type extends EventType> {
    abstract type: Type;
    plugins: EventModuleCommandPluginDefs[Type][] = [];
    onEvent: EventModuleEventPluginDefs[Type][] = [];
    abstract execute: EventModuleDefs[Type]['execute'];
}
