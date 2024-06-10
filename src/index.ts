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
import { AttachmentBuilder } from 'discord.js';
export type Controller = typeof controller
export * from './core/create-plugins';
export { CommandType, PluginType, PayloadType, EventType } from './core/structures/enums';
export { Context } from './core/structures/context';
export * from './core/ioc';

export type AssetEncoding = "attachment"|"base64"|"binary"|"utf8"

const ASSETS_DIR = path.resolve('assets');



/**
 * Reads an asset file from the 'assets' directory.
 * If encoding is 'attachment', a discord.js AttachmentBuilder is provided, else 
 * fs.promises.readFile is called. The default is utf8.
 */
export async function Asset(p: string, opts?: { name?: string, encoding: Exclude<AssetEncoding, 'attachment'> }): Promise<string>;
export async function Asset(p: string, opts?: { name?: string, encoding: 'attachment' }): Promise<AttachmentBuilder>;
export async function Asset(p: string, opts?: { name?: string, encoding: AssetEncoding }): Promise<string|AttachmentBuilder> {
    const encoding = opts?.encoding || 'utf8';

    let relativePath: string;
    if (path.isAbsolute(p)) {
        relativePath = path.relative(ASSETS_DIR, "assets" + p);
    } else {
        relativePath = p;
    }

    const filePath = path.join(ASSETS_DIR, relativePath);

    if (encoding === 'attachment') {
        const attachmentName = opts?.name || path.basename(filePath);
        return new AttachmentBuilder(filePath, { name: attachmentName });
    } else {
        return fs.readFile(filePath, encoding);
    }
}

