import type Wrapper from './structures/wrapper';
import { Err, Ok } from 'ts-results-es';
import { ExternalEventEmitters } from './utilities/readFile';
import type { EventEmitter } from 'events';
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
import { SernError } from './structures/errors';
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
import type { RequiredDependencies, ExtractFromPartial } from '../types/handler';
import { containerSubject, requireDependencies, useContainer } from './dependencies/provider';


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
    const { events } = wrapper;
    if (events !== undefined) {
        processEvents(wrapper, events);
    }
    new ReadyHandler(wrapper);
    new MessageHandler(wrapper);
    new InteractionHandler(wrapper);
}

/**
 * @deprecated - use Sern#makeDependencies instead
 * @param emitter Any external event emitter.
 * The object will be stored in a map, and then fetched by the name of the instance's class.
 * As there are infinite possibilities to adding external event emitters,
 * Most types aren't provided and are as narrow as possibly can.
 * @example
 * ```ts title="src/index.ts"
 * //Add this before initiating Sern!
 * Sern.addExternal(new Level())
 * ```
 * @example
 * ```ts title="events/level.ts"
 *  export default eventModule({
 *      emitter: 'Level',
 *      type : EventType.External,
 *      name: 'error',
 *      execute(args) {
 *          console.log(args)
 *      }
 *  })
 * ```
 */
export function addExternal<T extends EventEmitter>(emitter: T) {
    if (ExternalEventEmitters.has(emitter.constructor.name)) {
        throw Error(`${emitter.constructor.name} already exists!`);
    }
    ExternalEventEmitters.set(emitter.constructor.name, emitter);
}

/**
 * The object passed into every plugin to control a command's behavior
 */
export const controller = {
    next: () => Ok.EMPTY,
    stop: () => Err.EMPTY,
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
    const hasPlugins = mod.plugins && mod.plugins.length > 0;
    if (hasPlugins) {
        throw Error(
            SernError.NotSupportedYet + `: Plugins on event listeners are not supported yet`,
        );
    }
    return {
        ...mod,
        onEvent,
        plugins,
    } as EventModule;
}

export function makeDependencies<T extends Partial<RequiredDependencies>>(
    cb: (root: Container<{}, {}>) => Container<T, T>,
) {
    const container = cb(createContainer());
    requireDependencies(container);
    containerSubject.next(container as Container<RequiredDependencies & Record<string, unknown>, {}>);
    return useContainer<ExtractFromPartial<T>>();
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
