import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { Module } from '../structures/modules/commands/module';
import { SernError } from '../structures/errors';

//We can look into lazily loading modules once everything is set
export const ContextMenuUser = new Map<string, Module>();
export const ContextMenuMsg = new Map<string, Module>();
export const Commands = new Map<string, Module>();
export const Alias = new Map<string, Module>();
export const Buttons = new Map<string, Module>();
export const SelectMenus = new Map<string, Module>();


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
 * @param {commandsDir} Relative path to commands directory
 * @returns {Promise<{ mod: Command; absPath: string; }[]>} data from command files
 */

export async function buildData(commandDir: string ): Promise<
  {
    mod: Module;
    absPath: string;
  }[]
> {
  return Promise.all(
    getCommands(commandDir).map( async (absPath) => {
      const mod = <Module> (await import(absPath)).module;
      if (mod === undefined) throw Error(`${SernError.UNDEFINED_MODULE} ${absPath}`);
      return { mod, absPath };
    }),
  );
}

export function getCommands(dir: string): string[] {
  return readPath(join(process.cwd(), dir));
}
