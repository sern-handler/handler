import { Result } from 'ts-results-es';
import { type Observable, from, mergeMap, ObservableInput } from 'rxjs';
import { readdir, stat } from 'fs/promises';
import { basename, extname, join, resolve, parse } from 'path';
import assert from 'assert';
import { createRequire } from 'node:module';
import type { ImportPayload, Wrapper } from '../types/core';
import type { Module } from '../types/core-modules';

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
    let module = await import(absPath).then(esm => esm.default);

    assert(module, `Found no export for module at ${absPath}. Forgot to ignore with "!"? (!${basename(absPath)})?`);
    if ('default' in module) {
        module = module.default;
    }
    return Result
        .wrap(() => module.getInstance())
        .unwrapOr(module) as T;
}

export async function defaultModuleLoader<T extends Module>(absPath: string): ModuleResult<T> {
    let module = await importModule<T>(absPath);
    assert(module, `Found an undefined module: ${absPath}`);
    return { module, absPath };
}

export const fmtFileName = (fileName: string) => parse(fileName).name;

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

export const getFullPathTree = (dir: string) => readPaths(resolve(dir));

export const filename = (path: string) => fmtFileName(basename(path));

const isSkippable = (filename: string) => {
    //empty string is for non extension files (directories)
    const validExtensions = ['.js', '.cjs', '.mts', '.mjs', '.cts', '.ts', ''];
    return filename[0] === '!' || !validExtensions.includes(extname(filename));
};
async function deriveFileInfo(dir: string, file: string) {
    const fullPath = join(dir, file);
    return {
        fullPath,
        fileStats: await stat(fullPath),
        base: basename(file),
    };
}
async function* readPaths(dir: string): AsyncGenerator<string> {
    try {
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
    } catch (err) {
        throw err;
    }
}

const requir = createRequire(import.meta.url);

export function loadConfig(wrapper: Wrapper | 'file'): Wrapper {
    if (wrapper !== 'file') {
        return wrapper;
    }
    console.log('Experimental loading of sern.config.json');
    const config = requir(resolve('sern.config.json')); 

    const makePath = (dir: PropertyKey) =>
        config.language === 'typescript'
            ? join('dist', config.paths[dir]!)
            : join(config.paths[dir]!);
 
    console.log('Loading config: ', config);
    const commandsPath = makePath('commands');
 
    console.log('Commands path is set to', commandsPath);
    let eventsPath: string | undefined;
    if (config.paths.events) {
        eventsPath = makePath('events');
        console.log('Events path is set to', eventsPath);
    }
    return {
        defaultPrefix: config.defaultPrefix,
        commands: commandsPath,
        events: eventsPath,
    };
    
}
