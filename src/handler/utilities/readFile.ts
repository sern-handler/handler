import { ApplicationCommandType, ComponentType } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { from, Observable } from 'rxjs';
import type { PluggedModule } from '../structures/modules/module';

export const BothCommand = new Map<string, PluggedModule>();
export const ApplicationCommandStore = {
    [ApplicationCommandType.User]: new Map<string, PluggedModule>(),
    [ApplicationCommandType.Message]: new Map<string, PluggedModule>(),
    [ApplicationCommandType.ChatInput]: new Map<string, PluggedModule>(),
} as { [K in ApplicationCommandType]: Map<string, PluggedModule> };

export const MessageCompCommandStore = {
    [ComponentType.Button]: new Map<string, PluggedModule>(),
    [ComponentType.SelectMenu]: new Map<string, PluggedModule>(),
    [ComponentType.TextInput] : new Map<string, PluggedModule>()
};
export const TextCommandStore = {
    text: new Map<string, PluggedModule>(),
    aliases: new Map<string, PluggedModule>(),
};

// Courtesy @Townsy45
function readPath(dir: string, arrayOfFiles: string[] = []): string[] {
    try {
        const files = readdirSync(dir);
        for (const file of files) {
            if (statSync(dir + '/' + file).isDirectory()) readPath(dir + '/' + file, arrayOfFiles);
            else arrayOfFiles.push(join(dir, '/', file));
        }
    } catch (err) {
        throw err;
    }

    return arrayOfFiles;
}

export const fmtFileName = (n: string) => n.substring(0, n.length - 3);

/**
 *
 * @returns {Observable<{ mod: PluggedModule; absPath: string; }[]>} data from command files
 * @param commandDir
 */

export function buildData(commandDir: string): Observable<{
    plugged: PluggedModule;
    absPath: string;
}> {
    return from(
        getCommands(commandDir).map(absPath => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const plugged = <PluggedModule>require(absPath).module;
            return { plugged, absPath };
        }),
    );
}

export function getCommands(dir: string): string[] {
    return readPath(join(process.cwd(), dir));
}
