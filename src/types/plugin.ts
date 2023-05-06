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

import type { Err, Ok, Result } from 'ts-results-es';
import type { PluginType } from '../core/structures/enums';
import type { CommandModule, EventModule } from './module';
import type { InitArgs } from '../core/plugins';
import type { Awaitable } from './handler';
import { Processed } from './core';
export type PluginResult = Awaitable<VoidResult>;
export type VoidResult = Result<void, void>;

export interface Controller {
    next: () => Ok<void>;
    stop: () => Err<void>;
}
export interface Plugin<Args extends any[] = any[]> {
    type: PluginType;
    execute: (...args: Args) => PluginResult;
}

export interface InitPlugin<Args extends any[] = any[]> {
    type: PluginType.Init;
    execute: (...args: Args) => PluginResult;
}
export interface ControlPlugin<Args extends any[] = any[]> {
    type: PluginType.Control;
    execute: (...args: Args) => PluginResult;
}

export type AnyCommandPlugin = ControlPlugin | InitPlugin<[InitArgs<Processed<CommandModule>>]>;
export type AnyEventPlugin = ControlPlugin | InitPlugin<[InitArgs<Processed<EventModule>>]>;

