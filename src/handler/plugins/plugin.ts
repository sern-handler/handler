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
import type { BaseModule, CommandModuleDefs, EventModuleDefs } from '../structures/module';
import type { EventEmitter } from 'events';
import type {
    DiscordEventCommand,
    ExternalEventCommand,
    SernEventCommand,
} from '../structures/events';
import type SernEmitter from '../sernEmitter';
import type Wrapper from '../structures/wrapper';

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
                wrapper: Wrapper,
                payload: {
                    mod: DefinitelyDefined<CommandModuleDefs[T], 'name' | 'description'>;
                    absPath: string;
                },
                controller: Controller,
            ) => Awaitable<Result<void, void>>;
        }
    >;
}[T];

export type DiscordEmitterPlugin = Override<
    BasePlugin,
    {
        type: PluginType.Command;
        execute: (
            wrapper: Client,
            module: DefinitelyDefined<DiscordEventCommand, 'name' | 'description'>,
            controller: Controller,
        ) => Awaitable<Result<void, void>>;
    }
>;
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
        ) => Awaitable<Result<void, void>>;
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

export type SernEventPlugin<T extends keyof SernEventsMapping = keyof SernEventsMapping> = Override<
    BasePlugin,
    {
        name?: T;
        type: PluginType.Event;
        execute: (
            args: SernEventsMapping[T],
            controller: Controller,
        ) => Awaitable<Result<void, void>>;
    }
>;

export type ExternalEventPlugin = Override<
    BasePlugin,
    {
        type: PluginType.Event;
        execute: (args: unknown[], controller: Controller) => Awaitable<Result<void, void>>;
    }
>;

export type DiscordEventPlugin<T extends keyof ClientEvents = keyof ClientEvents> = Override<
    BasePlugin,
    {
        name?: T;
        type: PluginType.Event;
        execute: (args: ClientEvents[T], controller: Controller) => Awaitable<Result<void, void>>;
    }
>;

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
