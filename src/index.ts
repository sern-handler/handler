import fs from 'node:fs/promises'
import path from 'node:path'
export * as Sern from './sern';

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
    SDT
} from './types/core-modules';

export type {
    PluginResult,
    InitPlugin,
    ControlPlugin,
    Plugin,
    AnyPlugin,
} from './types/core-plugin';


export type { Payload, SernEventsMapping } from './types/utility';
export type { CoreDependencies } from './types/ioc';

export {
    commandModule,
    eventModule,
    discordEvent,
} from './core/modules';

export * from './core/presences'
export * from './core/interfaces'
import type { controller } from './core/create-plugins';
export type Controller = typeof controller
export * from './core/create-plugins';
export { CommandType, PluginType, PayloadType, EventType } from './core/structures/enums';
export { Context } from './core/structures/context';
export * from './core/ioc';


export async function Asset(p: string) {
    const assetsDir = path.resolve('assets');
    if (path.isAbsolute(p)) {
        const relativePath = path.relative(assetsDir, "assets"+p);
        return fs.readFile(path.join(assetsDir, relativePath), 'utf8');
    }
    return fs.readFile(path.join(assetsDir, p), 'utf8');
}


