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

import type { AutocompleteInteraction, Awaitable, Client, ClientEvents } from 'discord.js';
import type { Result, Ok, Err } from 'ts-results-es';
import type { CommandType, DefinitelyDefined, Override, SernEventsMapping } from '../../index';
import { EventType, PluginType } from '../../index';
import type { CommandModuleDefs, EventModuleDefs } from '../../types/module';
import type {
    DiscordEventCommand,
    ExternalEventCommand,
    SernEventCommand,
} from '../structures/events';

export interface Controller {
    next: () => Ok<void>;
    stop: () => Err<void>;
}
interface BasePlugin {
    name?: string;
    description?: string;
    type: PluginType
}

export type CommandPlugin<T extends keyof CommandModuleDefs = keyof CommandModuleDefs> = {
    [K in T]: Override<
        BasePlugin,
        {
            type: PluginType.Command;
            execute: (
                payload: {
                    mod: DefinitelyDefined<CommandModuleDefs[T], 'name' | 'description'>;
                    absPath: string;
                },
                controller: Controller,
            ) => Awaitable<Result<void, void>>;
        }
    >;
}[T];

export interface DiscordEmitterPlugin extends BasePlugin {
        type: PluginType.Command;
        execute: (
            wrapper: Client,
            module: DefinitelyDefined<DiscordEventCommand, 'name'>,
            controller: Controller,
        ) => Awaitable<Result<void, void>>;
}

export interface ExternalEmitterPlugin extends BasePlugin {
    type: PluginType.Command;
    execute: (
        module: DefinitelyDefined<ExternalEventCommand, 'name'>,
        controller: Controller,
    ) => Awaitable<Result<void, void>>;
}

export interface SernEmitterPlugin extends BasePlugin {
    type: PluginType.Command;
    execute: (
        module: DefinitelyDefined<SernEventCommand, 'name'>,
        controller: Controller,
    ) => Awaitable<Result<void, void>>;
}

export interface AutocompletePlugin extends BasePlugin {
    type: PluginType.Event;
    execute: (
        autocmp: AutocompleteInteraction,
        controlller: Controller,
    ) => Awaitable<Result<void, void>>;
}

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

interface SernEventPlugin<T extends keyof SernEventsMapping = keyof SernEventsMapping> extends BasePlugin {
    name?: T;
    type: PluginType.Event;
    execute: (
        args: SernEventsMapping[T],
        controller: Controller,
    ) => Awaitable<Result<void, void>>;
}

interface ExternalEventPlugin extends BasePlugin {
    type: PluginType.Event;
    execute: (args: unknown[], controller: Controller) => Awaitable<Result<void, void>>;
}

interface DiscordEventPlugin<T extends keyof ClientEvents = keyof ClientEvents> extends BasePlugin {
    name?: T;
    type: PluginType.Event;
    execute: (args: ClientEvents[T], controller: Controller) => Awaitable<Result<void, void>>;
}

export type CommandModuleNoPlugins = {
    [T in CommandType]: Omit<CommandModuleDefs[T], 'plugins' | 'onEvent'>;
};
export type EventModulesNoPlugins = {
    [T in EventType]: Omit<EventModuleDefs[T], 'plugins' | 'onEvent'>;
};
/**
 * Event Module Event Plugins
 */
export type EventModuleEventPluginDefs = {
    [EventType.Discord]: DiscordEventPlugin;
    [EventType.Sern]: SernEventPlugin;
    [EventType.External]: ExternalEventPlugin;
};

/**
 * Event Module Command Plugins
 */
export type EventModuleCommandPluginDefs = {
    [EventType.Discord]: DiscordEmitterPlugin;
    [EventType.Sern]: SernEmitterPlugin;
    [EventType.External]: ExternalEmitterPlugin;
};

export type EventModulePlugin<T extends EventType> =
    | EventModuleEventPluginDefs[T]
    | EventModuleCommandPluginDefs[T];

export type CommandModulePlugin<T extends CommandType> = EventPlugin<T> | CommandPlugin<T>;

/**
 * User inputs this type. Sern processes behind the scenes for better usage
 */
export type InputCommandModule = {
    [T in CommandType]: CommandModuleNoPlugins[T] & { plugins?: CommandModulePlugin<T>[] };
}[CommandType];

export type InputEventModule = {
    [T in EventType]: EventModulesNoPlugins[T] & { plugins?: EventModulePlugin<T>[] };
}[EventType];
