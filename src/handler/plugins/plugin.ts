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

import type { AutocompleteInteraction, Awaitable, ClientEvents } from 'discord.js';
import type { Result, Ok, Err } from 'ts-results-es';
import type { CommandType, SernEventsMapping } from '../../index';
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
export interface Plugin {
    name?: string;
    description?: string;
    type: PluginType
}

export type CommandPlugin<T extends keyof CommandModuleDefs = keyof CommandModuleDefs> = {
    [K in T]: Plugin &
        {
            type: PluginType.Command;
            execute: (
                payload: {
                    mod: CommandModuleDefs[T] & { name : string; description : string };
                    absPath: string;
                },
                controller: Controller,
            ) => Awaitable<Result<void, void>>;
        }
}[T];

export interface DiscordEmitterPlugin extends Plugin {
        type: PluginType.Command;
        execute: (
            payload: { mod: DiscordEventCommand & { name: string; description : string }; absPath: string },
            controller: Controller,
        ) => Awaitable<Result<void, void>>;
}

export interface ExternalEmitterPlugin extends Plugin {
    type: PluginType.Command;
    execute: (
        payload: { mod: ExternalEventCommand &  { name : string; description : string }; absPath: string } ,
        controller: Controller,
    ) => Awaitable<Result<void, void>>;
}

export interface SernEmitterPlugin extends Plugin {
    type: PluginType.Command;
    execute: (
        payload: { mod : SernEventCommand & { name : string }; absPath: string },
        controller: Controller,
    ) => Awaitable<Result<void, void>>;
}

export interface AutocompletePlugin extends Plugin {
    type: PluginType.Event;
    execute: (
        autocmp: AutocompleteInteraction,
        controlller: Controller,
    ) => Awaitable<Result<void, void>>;
}

export type EventPlugin<T extends keyof CommandModuleDefs = keyof CommandModuleDefs> = {
    [K in T]: Plugin &
        {
            type: PluginType.Event;
            execute: (
                event: Parameters<CommandModuleDefs[K]['execute']>,
                controller: Controller,
            ) => Awaitable<Result<void, void>>;
        }
}[T];

export interface SernEventPlugin<T extends keyof SernEventsMapping = keyof SernEventsMapping> extends Plugin {
    name?: T;
    type: PluginType.Event;
    execute: (
        args: SernEventsMapping[T],
        controller: Controller,
    ) => Awaitable<Result<void, void>>;
}

export interface ExternalEventPlugin extends Plugin {
    type: PluginType.Event;
    execute: (args: unknown[], controller: Controller) => Awaitable<Result<void, void>>;
}

export interface DiscordEventPlugin<T extends keyof ClientEvents = keyof ClientEvents> extends Plugin {
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
