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
import type {
    Module,
    Processed,
} from './core-modules';
import type { Awaitable } from './utility';
import type { CommandType, PluginType } from '../core/structures/enums'
import type { Context } from '../core/structures/context'
import type {
    ButtonInteraction,
    ChannelSelectMenuInteraction,
    MentionableSelectMenuInteraction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    RoleSelectMenuInteraction,
    StringSelectMenuInteraction,
    UserContextMenuCommandInteraction,
    UserSelectMenuInteraction,
} from 'discord.js';

export type PluginResult = Awaitable<Result<unknown, unknown>>;

export interface InitArgs<T extends Processed<Module> = Processed<Module>> {
    module: T;
    absPath: string;
    deps: Dependencies
    updateModule: (module: Partial<T>) => T
}
export interface Controller {
    next: () => Ok<unknown>;
    stop: () => Err<string|undefined>;
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

export type AnyPlugin = ControlPlugin | InitPlugin<[InitArgs<Processed<Module>>]>;

export type CommandArgs<I extends CommandType = CommandType > = CommandArgsMatrix[I]

interface CommandArgsMatrix {
    [CommandType.Text]: [Context];
    [CommandType.Slash]: [Context];
    [CommandType.Both]: [Context];
    [CommandType.CtxMsg]: [MessageContextMenuCommandInteraction];
    [CommandType.CtxUser]: [UserContextMenuCommandInteraction];
    [CommandType.Button]: [ButtonInteraction];
    [CommandType.StringSelect]: [StringSelectMenuInteraction];
    [CommandType.RoleSelect]: [RoleSelectMenuInteraction];
    [CommandType.ChannelSelect]: [ChannelSelectMenuInteraction];
    [CommandType.MentionableSelect]: [MentionableSelectMenuInteraction];
    [CommandType.UserSelect]: [UserSelectMenuInteraction];
    [CommandType.Modal]: [ModalSubmitInteraction];
}
