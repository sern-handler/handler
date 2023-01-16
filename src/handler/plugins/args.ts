import type { CommandType } from '../structures/enums';
import type { PluginType } from '../structures/enums';
import type { ClientEvents } from 'discord.js';
import type {
    BothCommand,
    ButtonCommand,
    ChannelSelectCommand,
    ContextMenuUser,
    DiscordEventCommand,
    ExternalEventCommand,
    MentionableSelectCommand,
    ModalSubmitCommand,
    RoleSelectCommand,
    SernEventCommand,
    SlashCommand,
    StringSelectCommand,
    TextCommand,
    UserSelectCommand,
    ContextMenuMsg, Module,
} from '../../types/module';
import type { Args, Payload, Processed, SlashOptions } from '../../types/handler';
import type Context from '../structures/context';
import type { MessageContextMenuCommandInteraction } from 'discord.js';
import type {
    ButtonInteraction,
    RoleSelectMenuInteraction,
    StringSelectMenuInteraction,
    UserContextMenuCommandInteraction,
} from 'discord.js';
import type {
    ChannelSelectMenuInteraction,
    MentionableSelectMenuInteraction,
    ModalSubmitInteraction,
    UserSelectMenuInteraction,
} from 'discord.js';
import { EventType } from '../structures/enums';

type CommandArgsMatrix = {
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
};

type EventArgsMatrix = {
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
};

export interface InitArgs<T extends Processed<Module>> {
    module: T;
    absPath: string;
}

export type CommandArgs<
    I extends CommandType = CommandType,
    J extends PluginType = PluginType,
> = CommandArgsMatrix[I][J];
export type EventArgs<
    I extends EventType = EventType,
    J extends PluginType = PluginType,
> = EventArgsMatrix[I][J];
