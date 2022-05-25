import { ApplicationCommandType, ComponentType } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { from, Observable } from 'rxjs';
import type { Module } from '../structures/module';

//Maybe move this? this probably doesnt belong in utlities/
export const BothCommands = new Map<string, Module>();
export const ApplicationCommands = {
    [ApplicationCommandType.User]: new Map<string, Module>(),
    [ApplicationCommandType.Message]: new Map<string, Module>(),
    [ApplicationCommandType.ChatInput]: new Map<string, Module>(),
} as { [K in ApplicationCommandType]: Map<string, Module> };

export const MessageCompCommands = {
    [ComponentType.Button]: new Map<string, Module>(),
    [ComponentType.SelectMenu]: new Map<string, Module>(),
    [ComponentType.TextInput]: new Map<string, Module>(),
};
export const TextCommands = {
    text: new Map<string, Module>(),
    aliases: new Map<string, Module>(),
};
export const ModalSubmitCommands = new Map<string, Module>();
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
 * @returns {Observable<{ mod: Module; absPath: string; }[]>} data from command files
 * @param commandDir
 */

export function buildData(commandDir: string): Observable<{
    mod: Module;
    absPath: string;
}> {
    return from(
        getCommands(commandDir).map(absPath => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const mod = <Module>require(absPath).default;
            return { mod, absPath };
        }),
    );
}

export function getCommands(dir: string): string[] {
    return readPath(join(process.cwd(), dir));
}
