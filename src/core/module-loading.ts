import { SernError } from './structures/errors';
import { Result, Err, Ok } from 'ts-results-es';
import { Module } from './types/modules';
import { type Observable, from, mergeMap, ObservableInput } from 'rxjs';
import { readdir, stat } from 'fs/promises';
import { basename, extname, join, resolve } from 'path';
import { ImportPayload } from '../handler/types';

export type ModuleResult<T> = Promise<Result<ImportPayload<T>, SernError>>;

/**
  * Import any module based on the absolute path.
  * This can accept four types of exported modules
  * commonjs, javascript :
  * ```js
  * exports = commandModule({ })
  * ```
  * esm javascript, typescript, and commonjs typescript
  * export default = commandModule({})
  */
export async function importModule<T>(absPath: string) {
    let module = await import(absPath).then(esm => esm.default); 
    if('default' in module) {
        module = module.default;
    }
    return Result
        .wrap(() => module.getInstance())
        .unwrapOr(module) as T;
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

function createSkipCondition(base: string) {
    const validExtensions = ['.js', '.cjs', '.mts', '.mjs', 'cts'];
    return ( type: 'file' | 'directory') => {
        if(type === 'file') {
           return fmtFileName(base)[0] === '!'
            || !validExtensions.includes(extname(base));
        }
        return base[0] === '!';
    }
}
async function deriveFileInfo(dir: string, file: string) {
     const fullPath = join(dir, file);
     return {
       fullPath,
       fileStats: await stat(fullPath),
       base: basename(file)
     }
}
async function* readPaths(dir: string, shouldDebug: boolean): AsyncGenerator<string> {
    try {
        const files = await readdir(dir);
        for (const file of files) {
            const { fullPath, fileStats, base } = await deriveFileInfo(dir, file);
            const isSkippable = createSkipCondition(base);
            if (fileStats.isDirectory()) {
                //Todo: refactor so that i dont repeat myself for files (line 71)
                if (isSkippable('directory')) {
                    if (shouldDebug) console.info(`ignored directory: ${fullPath}`);
                } else {
                    yield* readPaths(fullPath, shouldDebug);
                }
            } else {
                if (isSkippable('file')) {
                    if (shouldDebug) console.info(`ignored: ${fullPath}`);
                } else {
                    yield 'file:///' + fullPath;
                }
            }
        }
    } catch (err) {
        throw err;
    }
}
