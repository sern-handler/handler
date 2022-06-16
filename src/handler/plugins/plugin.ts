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
import { CommandType } from '../..';
import type { AutocompleteCommand, BaseModule, ModuleDefs } from '../structures/module';
import { PluginType } from '../structures/enums';

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

export type CommandPlugin<T extends keyof ModuleDefs = keyof ModuleDefs> = {
    [K in T]: Override<
        BasePlugin,
        {
            type: PluginType.Command;
            execute: (
                wrapper: Client,
                module: DefinitelyDefined<ModuleDefs[T], 'name' | 'description'>,
                controller: Controller,
            ) => Awaitable<Result<void, void>>;
        }
    >;
}[T];
export type EventPlugin<T extends keyof ModuleDefs = keyof ModuleDefs> = {
    [K in T]: Override<
        BasePlugin,
        {
            type: PluginType.Event;
            execute: (
                event: Parameters<ModuleDefs[K]['execute']>,
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
    [T in keyof ModuleDefs]: Omit<ModuleDefs[T], 'plugins' | 'onEvent'>;
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

// TODO: Do better typings
export function sernModule<T extends CommandType>(
    plugin: (CommandPlugin<T> | EventPlugin<T>)[],
    mod: ModuleNoPlugins[T],
): Module {
    const onEvent = plugin.filter(isEventPlugin);
    const plugins = plugin.filter(isCommandPlugin);
    if (mod.type === CommandType.Autocomplete) {
        throw new Error(
            'You cannot use this function declaration for Autocomplete Interactions! use the raw object for options or' +
                'sernAutoComplete function',
        );
    } else
        return {
            onEvent,
            plugins,
            ...mod,
        } as Module;
}

export function sernAutocomplete(
    onEvent: EventPlugin<CommandType.Autocomplete>[],
    mod: Omit<AutocompleteCommand, 'type' | 'name' | 'description' | 'onEvent'>,
): Omit<AutocompleteCommand, 'type' | 'name' | 'description'> {
    return {
        onEvent,
        ...mod,
    };
}
