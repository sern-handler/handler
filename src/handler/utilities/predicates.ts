import type {
    DiscordEventCommand,
    ExternalEventCommand,
    SernEventCommand,
} from '../structures/events';
import { EventType } from '../..';
import type { CommandModuleDefs, EventModule, Module } from '../../types/module';

export function correctModuleType<T extends keyof CommandModuleDefs>(
    plug: Module | undefined,
    type: T,
): plug is CommandModuleDefs[T] {
    // Another way to check if type is equivalent,
    // It will check based on flag system instead
    return plug !== undefined && (plug.type & type) !== 0;
}


export function isDiscordEvent(el: EventModule): el is DiscordEventCommand {
    return el.type === EventType.Discord;
}
export function isSernEvent(el: EventModule): el is SernEventCommand {
    return el.type === EventType.Sern;
}

export function isExternalEvent(el: EventModule): el is ExternalEventCommand {
    return el.type === EventType.External && 'emitter' in el;
}
