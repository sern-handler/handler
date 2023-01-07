/*
 * Plugins can be inserted on all commands and are emitted
 *
 * 1. On ready event, where all commands are loaded.
 * 2. On corresponding observable (when command triggers)
 *
 * The goal of plugins is to organize commands and
 * provide extensions to repetitive patterns
 * examples include refreshing modules,
 * categorizing commands, cool-downs, permissions, etc.
 * Plugins are reminiscent of middleware in express.
 */

import type {  Awaitable } from 'discord.js';
import type { Result, Ok, Err } from 'ts-results-es';
import type { CommandType } from '../structures/enums';
import type { CommandModuleDefs, EventModuleDefs } from '../../types/module';

import type { EventType, PluginType } from '../structures/enums';
import type { InitArgs } from './args';
import type { AnyDefinedModule, DefinedCommandModule, DefinedEventModule } from '../../types/handler';
export type PluginResult = Awaitable<Result<void, void>>;

export interface Controller {
    next: () => Ok<void>;
    stop: () => Err<void>;
}
export interface Plugin<Args extends any[] = any[]> {
    name?: string;
    /** @deprecated will be removed in the next update */
    description?: string;
    type: PluginType;
    execute: (...args: Args) => any
}

export interface InitPlugin<T extends AnyDefinedModule = AnyDefinedModule> extends Plugin {
    type: PluginType.Init;
    execute: (args: InitArgs<T>) => PluginResult
}

export interface ControlPlugin extends Plugin {
    type: PluginType.Control;
}

export type CommandModuleNoPlugins = {
    [T in CommandType]: Omit<CommandModuleDefs[T], 'plugins' | 'onEvent'>;
};
export type EventModulesNoPlugins = {
    [T in EventType]: Omit<EventModuleDefs[T], 'plugins' | 'onEvent'>;
};

export type AnyPlugin = ControlPlugin | InitPlugin;
export type AnyCommandPlugin = ControlPlugin | InitPlugin<DefinedCommandModule>;
export type AnyEventPlugin = ControlPlugin | InitPlugin<DefinedEventModule>;

export type InputEvent = {
    [T in EventType]: EventModulesNoPlugins[T] & { plugins?: AnyEventPlugin[] };
}[EventType];

export type InputCommand = {
    [T in CommandType]: CommandModuleNoPlugins[T] & { plugins?: AnyCommandPlugin[] };
}[EventType];