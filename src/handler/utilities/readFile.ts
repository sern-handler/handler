import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { from, Observable } from 'rxjs';
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

export function buildData(commandDir: string ): Observable<
  {
    plugged: PluggedModule;
    absPath: string;
  }> {
  return from(getCommands(commandDir).map(absPath => { 
       const plugged = (<PluggedModule> require(absPath).module);
       return { plugged, absPath }
  }))
}

export function getCommands(dir: string): string[] {
  return readPath(join(process.cwd(), dir));
}
