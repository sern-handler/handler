export * as Sern from './sern';

export type {
    Module,
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
    SDT,
    ScheduledTask
} from './types/core-modules';

export type {
    PluginResult,
    InitPlugin,
    ControlPlugin,
    Plugin,
    AnyPlugin,
} from './types/core-plugin';


export type { Payload, SernEventsMapping } from './types/utility';

export {
    commandModule,
    eventModule,
    discordEvent,
    scheduledTask
} from './core/modules';

export * from './core/presences'
export * from './core/interfaces'
export * from './core/plugin';
export { CommandType, PluginType, PayloadType, EventType } from './core/structures/enums';
export { Context } from './core/structures/context';
export { type CoreDependencies, makeDependencies, single, transient, Service, Services } from './core/ioc';


import type { Container } from '@sern/ioc';

/**
  * @deprecated This old signature will be incompatible with future versions of sern >= 4.0.0. See {@link makeDependencies}
  * @example
  * ```ts
  *  To switch your old code:
     await makeDependencies(({ add }) => { 
            add('@sern/client', new Client())
     })
  *  ```
  */
export interface DependencyConfiguration {
    build: (root: Container) => Container;
}
