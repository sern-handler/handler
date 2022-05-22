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
import type { Module, Override } from '../..';
import { CommandType } from '../..';
import type { BaseModule, ModuleDefs } from '../structures/module';
import type { PluginType } from '../structures/enums';
import type { ValueOf } from 'ts-pattern/dist/types/helpers';

export interface Controller {
    next: () => Ok<void>;
    stop: () => Err<void>;
}

type BasePlugin = Override<
    BaseModule,
    {
        type: PluginType;
    }
>;

export type CommandPlugin = Override<
    BasePlugin,
    {
        type: PluginType.Command;
        execute: (
            wrapper: Client,
            module: Module,
            controller: Controller,
        ) => Awaitable<Result<void, void>>;
    }
>;

//TODO: rn adding the modType check a little hackish. Find better way to determine the
// module type of the event plugin
export type EventPlugin<T extends keyof ModuleDefs> = Override<
    BasePlugin,
    {
        type: PluginType.Event;
        execute: (
            event: Parameters<ModuleDefs[T]['execute']>,
            controller: Controller,
        ) => Awaitable<Result<void, void>>;
    }
>;

export function plugins(...plug: CommandPlugin[]): CommandPlugin[];
export function plugins<T extends keyof ModuleDefs>(...plug: EventPlugin<T>[]): EventPlugin<T>[];
export function plugins<T extends keyof ModuleDefs>(...plug: EventPlugin<T>[] | CommandPlugin[]) {
    return plug;
}

type ModuleNoPlugins = ValueOf<{
    [T in keyof ModuleDefs]: Omit<ModuleDefs[T], 'plugins'>;
}>;

//TODO: I WANT BETTER TYPINGS AHHHHHHHHHHHHHHH

export function sernModule(plugins: CommandPlugin[], mod: ModuleNoPlugins): Module {
    if (mod.type !== CommandType.Autocomplete)
        return {
            plugins,
            ...mod,
        };
    else return mod;
}
