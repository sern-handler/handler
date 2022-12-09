import type { DiscordEventCommand, ExternalEventCommand, SernEventCommand } from '../structures/events';
import { CommandModule, EventType } from '../..';
import type { AnyModule, CommandModuleDefs, EventModule } from '../../types/module';

export function correctModuleType<T extends keyof CommandModuleDefs>(
    plug: AnyModule | undefined,
    type: T,
): plug is CommandModuleDefs[T] {
    // Another way to check if type is equivalent,
    // It will check based on flag system instead
    return plug !== undefined && (plug.type & type) !== 0;
}


export function isDiscordEvent(el: EventModule | CommandModule): el is DiscordEventCommand {
    return el.type === EventType.Discord;
}
export function isSernEvent(el: EventModule | CommandModule): el is SernEventCommand {
    return el.type === EventType.Sern;
}
export function isExternalEvent(el: EventModule | CommandModule): el is ExternalEventCommand {
    return el.type === EventType.External && 'emitter' in el;
}
