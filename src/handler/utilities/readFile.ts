import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { SernError } from '../structures/errors';
import type { PluggedModule } from '../structures/modules/module';

//We can look into lazily loading modules once everything is set
export const ContextMenuUser = new Map<string, PluggedModule>();
export const ContextMenuMsg = new Map<string, PluggedModule>();
export const Commands = new Map<string, PluggedModule>();
export const Alias = new Map<string, PluggedModule>();
export const Buttons = new Map<string, PluggedModule>();
export const SelectMenus = new Map<string, PluggedModule>();


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
 * @returns {Promise<{ mod: PluggedModule; absPath: string; }[]>} data from command files
 */

export async function buildData(commandDir: string ): Promise<
  {
    plugged: PluggedModule;
    absPath: string;
  }[]> {
  return Promise.all(
    getCommands(commandDir).map( async (absPath) => {
      const plugged = <PluggedModule> (await import(absPath)).module;
      if (plugged === undefined) throw Error(`${SernError.UndefinedModule} ${absPath}`);
      return { plugged , absPath };
    }),
  );
}

export function getCommands(dir: string): string[] {
  return readPath(join(process.cwd(), dir));
}
