//
// Plugins can be inserted on all commands and are emitted
//
// 1.) on ready event, where all commands are loaded.
// 2.) on corresponding observable (command triggers)
//
// The goal of plugins is to organize commands and
// provide extensions to repetitive patterns
// examples include refreshing modules,
// categorizing commands, cooldowns, permissions, etc.
// Plugins are reminiscent of middleware in express.
//

import type { Awaitable, Client } from 'discord.js';
import type { Err, Ok, Result } from 'ts-results';
import type { Module, Override, Wrapper } from '../..';
import type { CommandType } from '../sern';
import type { BaseModule, ModuleDefs } from '../structures/module';


export interface Controller {
    next: () => Ok<void>;
    stop: () => Err<void>;
}

export enum PluginType {
    Command = 0b01,
    Event = 0b10,
}

type executeCmdPlugin =  (controller: Controller) => Result<void, void> ;

type BasePlugin = Override<BaseModule, {
    type : PluginType,
    execute : executeCmdPlugin
}>;

export type CommandPlugin = Override<BasePlugin, {
    type: PluginType.Command;
    execute: (wrapper: Client, module: Module, controller: Controller) => Awaitable<Result<void, void>>;
}>;

//TODO: rn adding the modType check a little hackish. Find better way to determine the
// module type of the event plugin
export type EventPlugin<T extends CommandType> = Override<BasePlugin, {
    type: PluginType.Event;
    modType: T;
    execute: (event: Parameters<ModuleDefs[T]['execute']>, controller: Controller) => Awaitable<Result<void, void>>;
}>;


export function plugins<T extends CommandType>(...plug: (CommandPlugin | EventPlugin<T>)[]) {
    return plug;
}

export function sernModule<T extends CommandType>(
    plugs: (CommandPlugin | EventPlugin<T>)[], mod : ModuleDefs[T]
) : ModuleDefs[T] {
    //mod.plugins if defined, warn user to use first parameter
    //mod.onEvent if defined, warn user to use first parameter
    const plugins = plugs.filter(el => el.type === PluginType.Command);
    const onEvent = plugs.filter(el => el.type === PluginType.Event);
    return {
        plugins,
        onEvent,
        ...mod
    } as unknown as ModuleDefs[T];
}
