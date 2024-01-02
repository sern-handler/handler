import { ClientEvents } from 'discord.js';
import { CommandType, EventType, PluginType } from '../core/structures';
import type {
    AnyCommandPlugin,
    AnyEventPlugin,
    CommandArgs,
    ControlPlugin,
    EventArgs,
    InitPlugin,
} from '../types/core-plugin';
import type {
    CommandModule,
    EventModule,
    InputCommand,
    InputEvent,
    Module,
} from '../types/core-modules';
import { partitionPlugins } from './_internal';
import type { Awaitable } from '../types/utility';

/**
 * @since 1.0.0 The wrapper function to define command modules for sern
 * @param mod
 */
export function commandModule(mod: InputCommand): CommandModule {
    const [onEvent, plugins] = partitionPlugins(mod.plugins);
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
    const [onEvent, plugins] = partitionPlugins(mod.plugins);
    return {
        ...mod,
        plugins,
        onEvent,
    } as EventModule;
}

/** Create event modules from discord.js client events,
 * This is an {@link eventModule} for discord events,
 * where typings can be very bad.
 * @Experimental
 * @param mod
 */
export function discordEvent<T extends keyof ClientEvents>(mod: {
    name: T;
    plugins?: AnyEventPlugin[];
    execute: (...args: ClientEvents[T]) => Awaitable<unknown>;
}) {
    return eventModule({
        type: EventType.Discord,
        ...mod,
    });
}


/**
 * @deprecated
 */
function prepareClassPlugins(c: Module) {
    const [onEvent, initPlugins] = partitionPlugins(c.plugins);
    c.plugins = initPlugins as InitPlugin[];
    c.onEvent = onEvent as ControlPlugin[];
}

/**
 * @deprecated
 * Will be removed in future
 */
export abstract class CommandExecutable<const Type extends CommandType = CommandType> {
    abstract type: Type;
    plugins: AnyCommandPlugin[] = [];
    private static _instance: CommandModule;

    static getInstance() {
        if (!CommandExecutable._instance) {
            //@ts-ignore
            CommandExecutable._instance = new this();
            prepareClassPlugins(CommandExecutable._instance);
        }
        return CommandExecutable._instance;
    }

    abstract execute(...args: CommandArgs<Type, PluginType.Control>): Awaitable<unknown>;
}

/**
  * @deprecated
  * Will be removed in future
  */
export abstract class EventExecutable<Type extends EventType> {
    abstract type: Type;
    plugins: AnyEventPlugin[] = [];

    private static _instance: EventModule;
    static getInstance() {
        if (!EventExecutable._instance) {
            //@ts-ignore
            EventExecutable._instance = new this();
            prepareClassPlugins(EventExecutable._instance);
        }
        return EventExecutable._instance;
    }
    abstract execute(...args: EventArgs<Type, PluginType.Control>): Awaitable<unknown>;
}
