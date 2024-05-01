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

import type { Err, Ok } from 'ts-results-es';
import type {
    BothCommand,
    ButtonCommand,
    ChannelSelectCommand,
    CommandModule,
    ContextMenuMsg,
    ContextMenuUser,
    DiscordEventCommand,
    EventModule,
    ExternalEventCommand,
    MentionableSelectCommand,
    ModalSubmitCommand,
    Module,
    Processed,
    RoleSelectCommand,
    SernEventCommand,
    SlashCommand,
    StringSelectCommand,
    TextCommand,
    UserSelectCommand,
} from './core-modules';
import type { Args, Awaitable, Payload, SlashOptions } from './utility';
import type { CommandType, EventType, PluginType } from '../core/structures/enums'
import type { Context } from '../core/structures/context'
import type {
    ButtonInteraction,
    ChannelSelectMenuInteraction,
    ClientEvents,
    MentionableSelectMenuInteraction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    RoleSelectMenuInteraction,
    StringSelectMenuInteraction,
    UserContextMenuCommandInteraction,
    UserSelectMenuInteraction,
} from 'discord.js';
import type { VoidResult } from '../core/_internal';

export type PluginResult = Awaitable<VoidResult>;

export interface InitArgs<T extends Processed<Module>> {
    module: T;
    absPath: string;
}
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

export type CommandArgs<
    I extends CommandType = CommandType,
    J extends PluginType = PluginType,
> = CommandArgsMatrix[I][J];

export type EventArgs<
    I extends EventType = EventType,
    J extends PluginType = PluginType,
> = EventArgsMatrix[I][J];

interface CommandArgsMatrix {
    [CommandType.Text]: {
        [PluginType.Control]: [Context, ['text', string[]]];
        [PluginType.Init]: [InitArgs<Processed<TextCommand>>];
    };
    [CommandType.Slash]: {
        [PluginType.Control]: [Context, ['slash', /* library coupled */ SlashOptions]];
        [PluginType.Init]: [InitArgs<Processed<SlashCommand>>];
    };
    [CommandType.Both]: {
        [PluginType.Control]: [Context, Args];
        [PluginType.Init]: [InitArgs<Processed<BothCommand>>];
    };
    [CommandType.CtxMsg]: {
        [PluginType.Control]: [/* library coupled */ MessageContextMenuCommandInteraction];
        [PluginType.Init]: [InitArgs<Processed<ContextMenuMsg>>];
    };
    [CommandType.CtxUser]: {
        [PluginType.Control]: [/* library coupled */ UserContextMenuCommandInteraction];
        [PluginType.Init]: [InitArgs<Processed<ContextMenuUser>>];
    };
    [CommandType.Button]: {
        [PluginType.Control]: [/* library coupled */ ButtonInteraction];
        [PluginType.Init]: [InitArgs<Processed<ButtonCommand>>];
    };
    [CommandType.StringSelect]: {
        [PluginType.Control]: [/* library coupled */ StringSelectMenuInteraction];
        [PluginType.Init]: [InitArgs<Processed<StringSelectCommand>>];
    };
    [CommandType.RoleSelect]: {
        [PluginType.Control]: [/* library coupled */ RoleSelectMenuInteraction];
        [PluginType.Init]: [InitArgs<Processed<RoleSelectCommand>>];
    };
    [CommandType.ChannelSelect]: {
        [PluginType.Control]: [/* library coupled */ ChannelSelectMenuInteraction];
        [PluginType.Init]: [InitArgs<Processed<ChannelSelectCommand>>];
    };
    [CommandType.MentionableSelect]: {
        [PluginType.Control]: [/* library coupled */ MentionableSelectMenuInteraction];
        [PluginType.Init]: [InitArgs<Processed<MentionableSelectCommand>>];
    };
    [CommandType.UserSelect]: {
        [PluginType.Control]: [/* library coupled */ UserSelectMenuInteraction];
        [PluginType.Init]: [InitArgs<Processed<UserSelectCommand>>];
    };
    [CommandType.Modal]: {
        [PluginType.Control]: [/* library coupled */ ModalSubmitInteraction];
        [PluginType.Init]: [InitArgs<Processed<ModalSubmitCommand>>];
    };
}

interface EventArgsMatrix {
    [EventType.Discord]: {
        [PluginType.Control]: /* library coupled */ ClientEvents[keyof ClientEvents];
        [PluginType.Init]: [InitArgs<Processed<DiscordEventCommand>>];
    };
    [EventType.Sern]: {
        [PluginType.Control]: [Payload];
        [PluginType.Init]: [InitArgs<Processed<SernEventCommand>>];
    };
    [EventType.External]: {
        [PluginType.Control]: unknown[];
        [PluginType.Init]: [InitArgs<Processed<ExternalEventCommand>>];
    };
}
