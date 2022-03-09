import type { ApplicationCommandOptionData } from 'discord.js';
import type Module from '../structures/module';

import { readdirSync, statSync } from 'fs';
import { basename, join } from 'path';

export type CommandVal = {
  mod: Module<unknown> & { name : string };
  options: ApplicationCommandOptionData[];
};

export const Commands = new Map<string, CommandVal>();
export const Alias = new Map<string, CommandVal>();

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
 * @param {Sern.Handler} handler an instance of Sern.Handler
 * @returns {Promise<{ name: string; mod: Module<unknown>; absPath: string; }[]>} data from command files
 */

export async function buildData(commandDir: string ): Promise<
  {
    name: string;
    mod: Module<unknown>;
    absPath: string;
  }[]
> {
  return Promise.all(
    getCommands(commandDir).map( async (absPath) => {
      return { name: basename(absPath), mod: (await import(absPath)).default as Module<unknown>, absPath };
    }),
  );
}

export function getCommands(dir: string): string[] {
  return readPath(join(process.cwd(), dir));
}
