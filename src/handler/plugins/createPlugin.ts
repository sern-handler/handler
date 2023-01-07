import { CommandType, EventType, PluginType } from '../structures/enums';
import type { Plugin, PluginResult } from './plugin';
import type { CommandArgs, EventArgs } from './args';

export function Plugin<T extends PluginType>(
    name: string,
    type: T,
    execute: (...args: any[]) => any
) : Plugin {
    return {
        name,
        type,
        execute
    };
}

export function EventInit<I extends EventType>(
    name: string,
    execute: (...args: EventArgs<I, PluginType.Init>) => PluginResult
) {
    return Plugin(name, PluginType.Init, execute);
}

export function CommandInit<I extends CommandType>(
    name: string,
    execute: (...args: CommandArgs<I, PluginType.Init>) => PluginResult
) {
    return Plugin(name, PluginType.Init, execute);
}

export function ControlCommand<I extends CommandType>(
    name: string,
    execute: (...args: CommandArgs<I, PluginType.Control>) => PluginResult
) {
    return Plugin(name, PluginType.Control, execute);
}

export function ControlEvent<I extends EventType>(
    name: string,
    execute: (...args: EventArgs<I, PluginType.Control>) => PluginResult
) {
    return Plugin(name, PluginType.Control, execute);
}