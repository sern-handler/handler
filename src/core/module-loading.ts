import path from 'node:path';
import assert from 'assert';
import { createRequire } from 'node:module';
import type { Wrapper } from '../types/core';
import { existsSync } from 'fs';
import type { Logging } from './interfaces';


export const parseCallsite = (fpath: string) => {
    const pathobj = path.parse(fpath.replace(/file:\\?/, "")
                                    .split(path.sep)
                                    .join(path.posix.sep))
    return { name: pathobj.name,
             absPath : path.posix.format(pathobj) }
}

export const shouldHandle = (pth: string, filenam: string) => {
    const file_name = filenam+path.extname(pth);
    let newPath = path.join(path.dirname(pth), file_name)
                      .replace(/file:\\?/, "");
    return { exists: existsSync(newPath),
             path: 'file:///'+newPath };
}



/**
 * Import any module based on the absolute path.
 * This can accept four types of exported modules
 * commonjs, javascript :
 * ```js
 * exports = commandModule({ })
 *
 * //or
 * exports.default = commandModule({ })
 * ```
 * esm javascript, typescript, and commonjs typescript
 * export default commandModule({})
 */
export async function importModule<T>(absPath: string) {
    let fileModule = await import(absPath);

    let commandModule = fileModule.default;

    assert(commandModule , `No export @ ${absPath}. Forgot to ignore with "!"? (!${path.basename(absPath)})?`);
    if ('default' in commandModule) {
        commandModule = commandModule.default;
    }
    return { module: commandModule } as T;
}


export const fmtFileName = (fileName: string) => path.parse(fileName).name;

export const filename = (p: string) => fmtFileName(path.basename(p));

const requir = createRequire(import.meta.url);

export function loadConfig(wrapper: Wrapper | 'file', log: Logging | undefined): Wrapper {
    if (wrapper !== 'file') {
        return wrapper;
    }
    log?.info({ message: 'Experimental loading of sern.config.json'});
    const config = requir(path.resolve('sern.config.json')); 

    const makePath = (dir: PropertyKey) =>
        config.language === 'typescript'
            ? path.join('dist', config.paths[dir]!)
            : path.join(config.paths[dir]!);
 
    log?.info({ message: 'Loading config: ' + JSON.stringify(config, null, 4) });
    const commandsPath = makePath('commands');
 
    log?.info({ message: `Commands path is set to ${commandsPath}` });
    let eventsPath: string | undefined;
    if (config.paths.events) {
        eventsPath = makePath('events');
        log?.info({ message: `Events path is set to ${eventsPath} `});
    }

    return { defaultPrefix: config.defaultPrefix,
             commands: commandsPath,
             events: eventsPath };
    
}
