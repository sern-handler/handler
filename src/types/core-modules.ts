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
import { Awaitable, SernEventsMapping, UnpackedDependencies, Dictionary } from './utility';

/**
 * SDT (State, Dependencies, Type) interface represents the core data structure
 * passed through the plugin pipeline to command modules.
 * 
 * @interface SDT
 * @template TState - Type parameter for the state object's structure
 * @template TDeps - Type parameter for dependencies interface
 * 
 * @property {Record<string, unknown>} state - Accumulated state data passed between plugins
 * @property {TDeps} deps - Instance of application dependencies
 * @property {CommandType} type - Command type identifier
 * @property {string} [params] - Optional parameters passed to the command
 * 
 * @example
 * // Example of a plugin using SDT
 * const loggingPlugin = CommandControlPlugin((ctx, sdt: SDT) => {
 *     console.log(`User ${ctx.user.id} executed command`);
 *     return controller.next({ 'logging/timestamp': Date.now() });
 * });
 * 
 * @example
 * // Example of state accumulation through multiple plugins
 * const plugin1 = CommandControlPlugin((ctx, sdt: SDT) => {
 *     return controller.next({ 'plugin1/data': 'value1' });
 * });
 * 
 * const plugin2 = CommandControlPlugin((ctx, sdt: SDT) => {
 *     // Access previous state
 *     const prevData = sdt.state['plugin1/data'];
 *     return controller.next({ 'plugin2/data': 'value2' });
 * });
 * 
 * @remarks
 * - State is immutable and accumulated through the plugin chain
 * - Keys in state should be namespaced to avoid collisions
 * - Dependencies are injected and available throughout the pipeline
 * - Type information helps plugins make type-safe decisions
 * 
 * @see {@link CommandControlPlugin} for plugin implementation
 * @see {@link CommandType} for available command types
 * @see {@link Dependencies} for dependency injection interface
 */
export type SDT = {
    /**
     * Accumulated state passed between plugins in the pipeline.
     * Each plugin can add to or modify this state using controller.next().
     * 
     * @type {Record<string, unknown>}
     * @example
     * // Good: Namespaced state key
     * { 'myPlugin/userData': { id: '123', name: 'User' } }
     * 
     * // Avoid: Non-namespaced keys that might collide
     * { userData: { id: '123' } }
     */
    state: Record<string, unknown>;

    /**
     * Application dependencies available to plugins and command modules.
     * Typically includes services, configurations, and utilities.
     * 
     * @type {Dependencies}
     */
    deps: Dependencies;

    /**
     * Identifies the type of command being processed.
     * Used by plugins to apply type-specific logic.
     * 
     * @type {CommandType}
     */
    type: CommandType;

    /**
     * Optional parameters passed to the command.
     * May contain additional configuration or runtime data.
     * 
     * @type {string}
     * @optional
     */
    params?: string;

    /**
     * A copy of the current module that the plugin is running in.
     */
    module: { name: string; 
                  description: string;
                  meta: Dictionary; 
                  locals: Dictionary; }
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

    /**
     * Custom data storage object for module-specific information.
     * Plugins and module code can use this to store and retrieve metadata,
     * configuration, or any other module-specific information.
     * 
     * @type {Dictionary}
     * @description A key-value store that allows plugins and module code to persist
     * data at the module level. This is especially useful for InitPlugins that need
     * to attach metadata or configuration to modules.
     * 
     * @example
     * // In a plugin
     * module.locals.registrationDate = Date.now();
     * module.locals.version = "1.0.0";
     * module.locals.permissions = ["ADMIN", "MODERATE"];
     * 
     * @example
     * // In module execution
     * console.log(`Command registered on: ${new Date(module.locals.registrationDate)}`);
     * 
     * @example
     * // Storing localization data
     * module.locals.translations = {
     *   en: "Hello",
     *   es: "Hola",
     *   fr: "Bonjour"
     * };
     * 
     * @example
     * // Storing command metadata
     * module.locals.metadata = {
     *   category: "admin",
     *   cooldown: 5000,
     *   requiresPermissions: true
     * };
     * 
     * @remarks
     * - The locals object is initialized as an empty object ({}) by default
     * - Keys should be namespaced to avoid collisions between plugins
     * - Values can be of any type
     * - Data persists for the lifetime of the module
     * - Commonly used by InitPlugins during module initialization
     * 
     * @best-practices
     * 1. Namespace your keys to avoid conflicts:
     *    ```typescript
     *    module.locals['myPlugin:data'] = value;
     *    ```
     * 
     * 2. Document the data structure you're storing:
     *    ```typescript
     *    interface MyPluginData {
     *      version: string;
     *      timestamp: number;
     *    }
     *    module.locals['myPlugin:data'] = {
     *      version: '1.0.0',
     *      timestamp: Date.now()
     *    } as MyPluginData;
     *    ```
     * 
     * 3. Use type-safe accessors when possible:
     *    ```typescript
     *    const getPluginData = (module: Module): MyPluginData => 
     *      module.locals['myPlugin:data'];
     *    ```
     */
    locals: Dictionary;
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

export interface EventModuleDefs<T extends keyof ClientEvents = keyof ClientEvents> {
    [EventType.Sern]: SernEventCommand;
    [EventType.Discord]: DiscordEventCommand<T>;
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
type EventModulesNoPlugins<K extends keyof ClientEvents = keyof ClientEvents> = {
    [T in EventType]: Omit<EventModuleDefs<K>[T], 'plugins' | 'onEvent' | 'meta' | 'locals'> ;
};

export type InputEvent<K extends keyof ClientEvents = keyof ClientEvents> = {
    [T in EventType]: EventModulesNoPlugins<K>[T] & {
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


