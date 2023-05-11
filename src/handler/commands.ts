import { ClientEvents } from 'discord.js';
import { EventType, PluginType } from '../core/structures';
import { AnyEventPlugin, Plugin } from '../core/types/plugins';
import { CommandModule, EventModule, InputCommand, InputEvent } from '../core/types/modules';
import { partition } from '../core/functions';
import { Awaitable } from '../shared';
export const sernMeta = Symbol('@sern/meta');
export const UNREGISTERED = 'meow meow meow';
export const EMPTY_PATH = 'purr purr purr';
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
        [sernMeta]: {
            id: UNREGISTERED,
            fullPath: EMPTY_PATH
        }
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
        onEvent,
        plugins,
        [sernMeta]: {
            id: UNREGISTERED,
            fullPath: EMPTY_PATH
        },
        ...mod,
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

///**
// * @Experimental
// * Will be refactored / changed in future
// */
//export abstract class CommandExecutable<Type extends CommandType> {
//    abstract type: Type;
//    private static _fullPath = filePath();
//    name = filename(CommandExecutable._fullPath);
//    [sernMeta] = {
//        id: ``,
//        fullPath: CommandExecutable._fullPath
//    }
//    plugins: InitPlugin[] = [];
//    onEvent: ControlPlugin[] = [];
//    abstract execute() : Awaitable<unknown>
//
//}
///**
// * @Experimental
// * Will be refactored in future
// */
//export abstract class EventExecutable<Type extends EventType> {
//    abstract type: Type;
//    [sernMeta] = {
//        id: '',
//        fullPath: ''
//    }
//    plugins: InitPlugin[] = [];
//    onEvent: ControlPlugin[] = [];
//    abstract execute(): Awaitable<unknown>;
//}
