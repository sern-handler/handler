import type { ApplicationCommandOptionData } from 'discord.js';

import { readdirSync, statSync } from 'fs';

import { basename, join } from 'path';

import type * as Sern from '../sern';

export type CommandVal = {
    mod: Sern.Module<unknown>;
    options: ApplicationCommandOptionData[];
};

export const Commands = new Map<string, CommandVal>();
export const Alias = new Map<string, CommandVal>();

// Courtesy of Townsy#0001 on Discord
async function readPath(dir: string, arrayOfFiles: string[] = []): Promise<string[]> {
    try {
        const files = readdirSync(dir);
        for (const file of files) {
            if (statSync(dir + '/' + file).isDirectory()) await readPath(dir + '/' + file, arrayOfFiles);
            else arrayOfFiles.push(join(dir, '/', file));
        }
    } catch (err) {
        throw err;
    }

    return arrayOfFiles;
}

export const fmtFileName = (n: string) => n.substring(0, n.length - 3);

/**
 * @param {Sern.Handler} handler an instance of Sern.Handler
 * @returns {Promise<{ name: string; mod: Sern.Module<unknown>; absPath: string; }[]>} data from command files
 */

export async function buildData(handler: Sern.Handler): Promise<
    {
        name: string;
        mod: Sern.Module<unknown>;
        absPath: string;
    }[]
> {
    const commandDir = handler.commandDir;
    return Promise.all(
        (await getCommands(commandDir)).map(async (absPath) => {
            return { name: basename(absPath), mod: (await import(absPath)).default as Sern.Module<unknown>, absPath };
        }),
    );
}

export async function getCommands(dir: string): Promise<string[]> {
    return readPath(join(process.cwd(), dir));
}
