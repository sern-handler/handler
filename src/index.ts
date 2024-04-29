export * as Sern from './sern';
export * from './core';
export type {
    CommandModule,
    EventModule,
    BothCommand,
    ContextMenuMsg,
    ContextMenuUser,
    SlashCommand,
    TextCommand,
    ButtonCommand,
    StringSelectCommand,
    MentionableSelectCommand,
    UserSelectCommand,
    ChannelSelectCommand,
    RoleSelectCommand,
    ModalSubmitCommand,
    DiscordEventCommand,
    SernEventCommand,
    ExternalEventCommand,
    CommandModuleDefs,
    EventModuleDefs,
    SernAutocompleteData,
    SernOptionsData,
    SernSubCommandData,
    SernSubCommandGroupData,
} from './types/core-modules';

export type {
    Controller,
    PluginResult,
    InitPlugin,
    ControlPlugin,
    Plugin,
    AnyEventPlugin,
    AnyCommandPlugin,
} from './types/core-plugin';

export interface Wrapper {
    commands: string;
    defaultPrefix?: string;
    events?: string;
}
export type { Args, SlashOptions, Payload, SernEventsMapping } from './types/utility';
export type { Singleton, Transient, CoreDependencies } from './types/ioc';

export {
    commandModule,
    eventModule,
    discordEvent,
} from './core/modules';

export * as Presence from './core/presences'


