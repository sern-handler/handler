import { type Observable, from, mergeMap, ObservableInput } from 'rxjs';
import { readdir, stat } from 'fs/promises';
import path from 'node:path';
import assert from 'assert';
import { createRequire } from 'node:module';
import type { ImportPayload, Wrapper } from '../types/core';
import type { Module } from '../types/core-modules';
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


export type ModuleResult<T> = Promise<ImportPayload<T>>;

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

    assert(commandModule , `Found no export @ ${absPath}. Forgot to ignore with "!"? (!${path.basename(absPath)})?`);
    if ('default' in commandModule) {
        commandModule = commandModule.default;
    }
    return { module: commandModule } as T;
}

export async function defaultModuleLoader<T extends Module>(absPath: string): ModuleResult<T> {
    let { module } = await importModule<{ module: T }>(absPath);
    assert(module, `Found an undefined module: ${absPath}`);
    return { module, absPath };
}

export const fmtFileName = (fileName: string) => path.parse(fileName).name;

/**
 * a directory string is converted into a stream of modules.
 * starts the stream of modules that sern needs to process on init
 * @returns {Observable<{ mod: Module; absPath: string; }[]>} data from command files
 * @param commandDir
 */
export function buildModuleStream<T extends Module>(
    input: ObservableInput<string>,
): Observable<ImportPayload<T>> {
    return from(input).pipe(mergeMap(defaultModuleLoader<T>));
}

export const getFullPathTree = (dir: string) => readPaths(path.resolve(dir));

export const filename = (p: string) => fmtFileName(path.basename(p));

const validExtensions = ['.js', '.ts', ''];
const isSkippable = (filename: string) => {
    //empty string is for non extension files (directories)
    return filename[0] === '!' || !validExtensions.includes(path.extname(filename));
};

async function deriveFileInfo(dir: string, file: string) {
    const fullPath = path.join(dir, file);
    return { fullPath,
             fileStats: await stat(fullPath),
             base: path.basename(file) };
}

async function* readPaths(dir: string): AsyncGenerator<string> {
    const files = await readdir(dir);
    for (const file of files) {
        const { fullPath, fileStats, base } = await deriveFileInfo(dir, file);
        if (fileStats.isDirectory()) {
            //Todo: refactor so that i dont repeat myself for files (line 71)
            if (!isSkippable(base)) {
                yield* readPaths(fullPath);
            }
        } else {
            if (!isSkippable(base)) {
                yield 'file:///' + fullPath;
            }
        }
    }
}

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
