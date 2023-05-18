import { SernError } from './structures/errors';
import { type Result, Err, Ok } from 'ts-results-es';
import { Module } from './types/modules';
import { type Observable, from, mergeMap, ObservableInput } from 'rxjs';
import { readdir, stat } from 'fs/promises';
import { basename, extname, join, resolve } from 'path';
import { ImportPayload } from '../handler/types';
import { CommandExecutable, clazz } from '../handler/commands';

export type ModuleResult<T> = Promise<Result<ImportPayload<T>, SernError>>;


function isClassModule(m: unknown): m is typeof CommandExecutable {
    return m != undefined && Reflect.has(m, clazz);
}

export async function importModule<T>(absPath: string) {
    let module = 
    /// #if MODE === 'esm'
    import(absPath).then(i => i.default);  // eslint-disable-line
    /// #elif MODE === 'cjs'
    require(absPath).default; // eslint-disable-line
    /// #endif
    return module.then(m => isClassModule(m) ? m.getInstance():m) as T;
}
export async function defaultModuleLoader<T extends Module>(absPath: string): ModuleResult<T> {
    let module = await importModule<T>(absPath);
    if (module === undefined) {
        return Err(SernError.UndefinedModule);
    }
    //todo readd class modules
    return Ok({ module, absPath });
}


export const fmtFileName = (n: string) => n.substring(0, n.length - 3);

/**
 * a directory string is converted into a stream of modules.
 * starts the stream of modules that sern needs to process on init
 * @returns {Observable<{ mod: Module; absPath: string; }[]>} data from command files
 * @param commandDir
 */
export function buildModuleStream<T extends Module>(
    input: ObservableInput<string>,
): Observable<Result<ImportPayload<T>, SernError>> {
    return from(input).pipe(mergeMap(defaultModuleLoader<T>));
}

export function getFullPathTree(dir: string, mode: boolean) {
    return readPaths(resolve(dir), mode);
}

export function filename(path: string) {
    return fmtFileName(basename(path));
}

async function* readPaths(dir: string, shouldDebug: boolean): AsyncGenerator<string> {
    try {
        const files = await readdir(dir);
        for (const file of files) {
            const fullPath = join(dir, file);
            const fileStats = await stat(fullPath);
            const base = basename(file);
            if (fileStats.isDirectory()) {
                //Todo: refactor so that i dont repeat myself for files (line 71)
                if(base.endsWith('-ignore!')) {
                    if(shouldDebug) 
                        console.info(`ignored directory: ${fullPath}`);
                } else {
                    yield* readPaths(fullPath, shouldDebug);
                }
            } else {
                const isSkippable = fmtFileName(base).endsWith('-ignore!')
                || !['.js', '.cjs', '.mts', '.mjs'].includes(extname(base));

                if(isSkippable) {
                    if(shouldDebug)
                        console.info(`ignored: ${fullPath}`);
                } else {
                    /// #if MODE === 'esm'
                    yield 'file:///' + fullPath;
                    /// #elif MODE === 'cjs'
                    yield fullPath;
                    /// #endif
                }
            }
        }
    } catch (err) {
        throw err;
    }
}

