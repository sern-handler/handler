import type {
    APIApplicationCommandBasicOption,
    APIApplicationCommandOptionBase,
    ApplicationCommandOptionType,
    BaseApplicationCommandOptionsData,
    AutocompleteInteraction,
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
    ChatInputCommandInteraction,
} from 'discord.js';
import type { CommandType, EventType } from '../core/structures/enums';
import { Context } from '../core/structures/context'
import { ControlPlugin, InitPlugin, Plugin } from './core-plugin';
import { Awaitable, SernEventsMapping, UnpackedDependencies } from './utility';

//state, deps, type (very original)
export type SDT = {
    state: Record<string,unknown>;
    deps: Dependencies;
    type: CommandType,
    params?: string
};

export type Processed<T> = T & { name: string; description: string };

export interface Module {
    type: CommandType | EventType;
    name?: string;
    onEvent: ControlPlugin[];
    plugins: InitPlugin[];
    description?: string;
    meta: {
        id: string;
        absPath: string;
    }
    locals: Record<string,unknown>
    execute(...args: any[]): Awaitable<any>;
}

export interface SernEventCommand<T extends keyof SernEventsMapping = keyof SernEventsMapping>
    extends Module {
    name?: T;
    type: EventType.Sern;
    execute(...args: SernEventsMapping[T]): Awaitable<unknown>;
}

export interface ExternalEventCommand extends Module {
    name?: string;
    emitter: keyof Dependencies;
    type: EventType.External;
    execute(...args: unknown[]): Awaitable<unknown>;
}


export interface ContextMenuUser extends Module {
    type: CommandType.CtxUser;
    execute: (ctx: UserContextMenuCommandInteraction, tbd: SDT) => Awaitable<unknown>;
}

export interface ContextMenuMsg extends Module {
    type: CommandType.CtxMsg;
    execute: (ctx: MessageContextMenuCommandInteraction, tbd: SDT) => Awaitable<unknown>;
}

export interface ButtonCommand extends Module {
    type: CommandType.Button;
    execute: (ctx: ButtonInteraction, tbd: SDT) => Awaitable<unknown>;
}

export interface StringSelectCommand extends Module {
    type: CommandType.StringSelect;
    execute: (ctx: StringSelectMenuInteraction, tbd: SDT) => Awaitable<unknown>;
}

export interface ChannelSelectCommand extends Module {
    type: CommandType.ChannelSelect;
    execute: (ctx: ChannelSelectMenuInteraction, tbd: SDT) => Awaitable<unknown>;
}

export interface RoleSelectCommand extends Module {
    type: CommandType.RoleSelect;
    execute: (ctx: RoleSelectMenuInteraction, tbd: SDT) => Awaitable<unknown>;
}

export interface MentionableSelectCommand extends Module {
    type: CommandType.MentionableSelect;
    execute: (ctx: MentionableSelectMenuInteraction, tbd: SDT) => Awaitable<unknown>;
}

export interface UserSelectCommand extends Module {
    type: CommandType.UserSelect;
    execute: (ctx: UserSelectMenuInteraction, tbd: SDT) => Awaitable<unknown>;
}

export interface ModalSubmitCommand extends Module {
    type: CommandType.Modal;
    execute: (ctx: ModalSubmitInteraction, tbd: SDT) => Awaitable<unknown>;
}

export interface AutocompleteCommand {
    onEvent?: ControlPlugin[];
    execute: (ctx: AutocompleteInteraction, tbd: SDT) => Awaitable<unknown>;
}

export interface DiscordEventCommand<T extends keyof ClientEvents = keyof ClientEvents>
    extends Module {
    name?: T;
    type: EventType.Discord;
    execute(...args: ClientEvents[T]): Awaitable<unknown>;
}
export interface TextCommand extends Module {
    type: CommandType.Text;
    execute: (ctx: Context & { get options(): string[] }, tbd: SDT) => Awaitable<unknown>;
}

export interface SlashCommand extends Module {
    type: CommandType.Slash;
    description: string;
    options?: SernOptionsData[];
    execute: (ctx: Context  & { get options(): ChatInputCommandInteraction['options']}, tbd: SDT) => Awaitable<unknown>;
}

export interface BothCommand extends Module {
    type: CommandType.Both;
    description: string;
    options?: SernOptionsData[];
    execute: (ctx: Context, tbd: SDT) => Awaitable<unknown>;
}

export type EventModule = DiscordEventCommand | SernEventCommand | ExternalEventCommand;  
export type CommandModule =
    | TextCommand
    | SlashCommand
    | BothCommand
    | ContextMenuUser
    | ContextMenuMsg
    | ButtonCommand
    | StringSelectCommand
    | MentionableSelectCommand
    | UserSelectCommand
    | ChannelSelectCommand
    | RoleSelectCommand
    | ModalSubmitCommand;

//https://stackoverflow.com/questions/64092736/alternative-to-switch-statement-for-typescript-discriminated-union
// Explicit Module Definitions for mapping
export interface CommandModuleDefs {
    [CommandType.Text]: TextCommand;
    [CommandType.Slash]: SlashCommand;
    [CommandType.Both]: BothCommand;
    [CommandType.CtxMsg]: ContextMenuMsg;
    [CommandType.CtxUser]: ContextMenuUser;
    [CommandType.Button]: ButtonCommand;
    [CommandType.StringSelect]: StringSelectCommand;
    [CommandType.RoleSelect]: RoleSelectCommand;
    [CommandType.ChannelSelect]: ChannelSelectCommand;
    [CommandType.MentionableSelect]: MentionableSelectCommand;
    [CommandType.UserSelect]: UserSelectCommand;
    [CommandType.Modal]: ModalSubmitCommand;
}

export interface EventModuleDefs {
    [EventType.Sern]: SernEventCommand;
    [EventType.Discord]: DiscordEventCommand;
    [EventType.External]: ExternalEventCommand;
}

export interface SernAutocompleteData
    extends Omit<BaseApplicationCommandOptionsData, 'autocomplete'> {
    autocomplete: true;
    type:
        | ApplicationCommandOptionType.String
        | ApplicationCommandOptionType.Number
        | ApplicationCommandOptionType.Integer;
    command: AutocompleteCommand;
}

type CommandModuleNoPlugins = {
    [T in CommandType]: Omit<CommandModuleDefs[T], 'plugins' | 'onEvent' | 'meta' | 'locals'>;
};
type EventModulesNoPlugins = {
    [T in EventType]: Omit<EventModuleDefs[T], 'plugins' | 'onEvent' | 'meta' | 'locals'> ;
};

export type InputEvent = {
    [T in EventType]: EventModulesNoPlugins[T] & {
        once?: boolean;
        plugins?: InitPlugin[] 
    };
}[EventType];

export type InputCommand = {
    [T in CommandType]: CommandModuleNoPlugins[T] & {
        plugins?: Plugin[];
    };
}[CommandType];

/**
 * Type that replaces autocomplete with {@link SernAutocompleteData}
 */
export type SernOptionsData =
    | SernSubCommandData
    | SernSubCommandGroupData
    | APIApplicationCommandBasicOption
    | SernAutocompleteData;

export interface SernSubCommandData
    extends APIApplicationCommandOptionBase<ApplicationCommandOptionType.Subcommand> {
    type: ApplicationCommandOptionType.Subcommand;
    options?: SernOptionsData[];
}

export interface SernSubCommandGroupData extends BaseApplicationCommandOptionsData {
    type: ApplicationCommandOptionType.SubcommandGroup;
    options?: SernSubCommandData[];
}


export interface ScheduledTaskContext {
     
    /**
     * the uuid of the current task being run
     */
    id: string;
    /**
     * the last time this task was executed. If this is the first time, it is null.
     */
    lastTimeExecution: Date | null;
    /**
      * The next time this task will be executed.
      */
    nextTimeExecution: Date | null;
}

//name subject to change
interface TaskAttrs {
    /**
     * An object of dependencies configured in `makeDependencies`
     */
    deps: UnpackedDependencies
}

export interface ScheduledTask {
    name?: string;
    trigger: string | Date;
    timezone?: string;
    execute(tasks: ScheduledTaskContext, sdt: TaskAttrs): Awaitable<void>
}


