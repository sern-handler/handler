/*
 * Plugins can be inserted on all commands and are emitted
 *
 * 1. On ready event, where all commands are loaded.
 * 2. On corresponding observable (when command triggers)
 *
 * The goal of plugins is to organize commands and
 * provide extensions to repetitive patterns
 * examples include refreshing modules,
 * categorizing commands, cooldowns, permissions, etc.
 * Plugins are reminiscent of middleware in express.
 */

import type { Awaitable, Client } from 'discord.js';
import type { Err, Ok, Result } from 'ts-results';
import type { DefinitelyDefined, Module, Override } from '../..';
import type { CommandType } from '../..';
import type {
    BaseModule,
    EventModule,
    CommandModuleDefs,
    CommandModule,
} from '../structures/module';
import { PluginType } from '../structures/enums';
import type { EventEmitter } from 'events';
import type { ExternalEventCommand, SernEventCommand } from '../structures/events';
import type SernEmitter from '../sernEmitter';
import type { AutocompleteInteraction } from 'discord.js';

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

export type CommandPlugin<T extends keyof CommandModuleDefs = keyof CommandModuleDefs> = {
    [K in T]: Override<
        BasePlugin,
        {
            type: PluginType.Command;
            execute: (
                wrapper: Client,
                module: DefinitelyDefined<CommandModuleDefs[T], 'name' | 'description'>,
                controller: Controller,
            ) => Awaitable<Result<void, void>>;
        }
    >;
}[T];

export type ExternalEmitterPlugin<T extends EventEmitter = EventEmitter> = Override<
    BasePlugin,
    {
        type: PluginType.Command;
        execute: (
            wrapper: T,
            module: DefinitelyDefined<ExternalEventCommand, 'name' | 'description'>,
            controller: Controller,
        ) => Awaitable<Result<void, void>>;
    }
>;

export type SernEmitterPlugin = Override<
    BasePlugin,
    {
        type: PluginType.Command;
        execute: (
            wrapper: SernEmitter,
            module: DefinitelyDefined<SernEventCommand, 'name' | 'description'>,
            controller: Controller,
        ) => Awaitable<Result<void, void>>;
    }
>;

export type AutocompletePlugin = Override<
    BaseModule,
    {
        type: PluginType.Event;
        execute: (
            autocmp: AutocompleteInteraction,
            controlller: Controller,
        ) => Awaitable<void | unknown>;
    }
>;

export type EventPlugin<T extends keyof CommandModuleDefs = keyof CommandModuleDefs> = {
    [K in T]: Override<
        BasePlugin,
        {
            type: PluginType.Event;
            execute: (
                event: Parameters<CommandModuleDefs[K]['execute']>,
                controller: Controller,
            ) => Awaitable<Result<void, void>>;
        }
    >;
}[T];

// Syntactic sugar on hold
// export function plugins<T extends keyof ModuleDefs>(
//     ...plug: (EventPlugin<T> | CommandPlugin<T>)[]
// ) {
//     return plug;
// }

export type ModuleNoPlugins = {
    [T in keyof CommandModuleDefs]: Omit<CommandModuleDefs[T], 'plugins' | 'onEvent'>;
};

function isEventPlugin<T extends CommandType>(
    e: CommandPlugin<T> | EventPlugin<T>,
): e is EventPlugin<T> {
    return e.type === PluginType.Event;
}
function isCommandPlugin<T extends CommandType>(
    e: CommandPlugin<T> | EventPlugin<T>,
): e is CommandPlugin<T> {
    return !isEventPlugin(e);
}
//TODO: I WANT BETTER TYPINGS AHHHHHHHHHHHHHHH
// Maybe add overlaods

export function sernModule<T extends CommandType.Slash = CommandType.Slash>(
    plugin: (CommandPlugin<T> | EventPlugin<T>)[],
    mod: ModuleNoPlugins[CommandType.Slash],
): Module;
export function sernModule<T extends CommandType.Text = CommandType.Text>(
    plugin: (CommandPlugin<T> | EventPlugin<T>)[],
    mod: ModuleNoPlugins[CommandType.Text],
): Module;
export function sernModule<T extends CommandType.Button = CommandType.Button>(
    plugin: (CommandPlugin<T> | EventPlugin<T>)[],
    mod: ModuleNoPlugins[CommandType.Button],
): Module;
export function sernModule<T extends CommandType.Both = CommandType.Both>(
    plugin: (CommandPlugin<T> | EventPlugin<T>)[],
    mod: ModuleNoPlugins[CommandType.Both],
): Module;
export function sernModule<T extends CommandType.MenuUser = CommandType.MenuUser>(
    plugin: (CommandPlugin<T> | EventPlugin<T>)[],
    mod: ModuleNoPlugins[CommandType.MenuMsg],
): Module;
export function sernModule<T extends CommandType.MenuSelect = CommandType.MenuSelect>(
    plugin: (CommandPlugin<T> | EventPlugin<T>)[],
    mod: ModuleNoPlugins[CommandType.MenuSelect],
): Module;

export function sernModule<T extends CommandType.Modal = CommandType.Modal>(
    plugin: (CommandPlugin<T> | EventPlugin<T>)[],
    mod: ModuleNoPlugins[CommandType.Modal],
): Module;

export function sernModule<T extends CommandType.MenuUser = CommandType.MenuUser>(
    plugin: (CommandPlugin<T> | EventPlugin<T>)[],
    mod: ModuleNoPlugins[CommandType.MenuUser],
): Module;
export function sernModule<T extends keyof CommandModuleDefs = keyof CommandModuleDefs>(
    plugin: (CommandPlugin<T> | EventPlugin<T>)[],
    mod: ModuleNoPlugins[T],
): CommandModule {
    const onEvent = plugin.filter(isEventPlugin);
    const plugins = plugin.filter(isCommandPlugin);
    return {
        onEvent,
        plugins,
        ...mod,
    } as CommandModule;
}

export function eventModule<T extends keyof EventModule>(): EventModule {
    return {} as EventModule;
}
