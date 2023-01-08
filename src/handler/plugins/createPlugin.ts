import { CommandType, EventType, PluginType } from '../structures/enums';
import type { Plugin, PluginResult } from './plugin';
import type { CommandArgs, EventArgs } from './args';

export function makePlugin<T extends PluginType>(
    type: T,
    execute: (...args: any[]) => any
): Plugin {
    return {
        type,
        execute
    };
}

export function EventInitPlugin<I extends EventType>(
    execute: (...args: EventArgs<I, PluginType.Init>) => PluginResult
) {
    return makePlugin(PluginType.Init, execute);
}

export function CommandInitPlugin<I extends CommandType>(
    execute: (...args: CommandArgs<I, PluginType.Init>) => PluginResult
) {
    return makePlugin(PluginType.Init, execute);
}

export function CommandControlPlugin<I extends CommandType>(
    execute: (...args: CommandArgs<I, PluginType.Control>) => PluginResult
)  {
    return makePlugin(PluginType.Control, execute);
}

export function EventControlPlugin<I extends EventType>(
    execute: (...args: EventArgs<I, PluginType.Control>) => PluginResult
) {
    return makePlugin(PluginType.Control, execute);
}