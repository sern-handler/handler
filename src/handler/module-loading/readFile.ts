import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { type Observable, from, mergeMap } from 'rxjs';
import { SernError } from '../structures/errors';
import { type Result, Err, Ok } from 'ts-results-es';
import { ImportPayload } from '../../types/handler';
import { pathToFileURL } from 'node:url'


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
// export const isLazy = (n: string) => n.indexOf(".lazy.", n.length-9) !== -1;

export async function defaultModuleLoader<T>(absPath: string): Promise<Result<ImportPayload<T>, SernError>> {
    
    // prettier-ignore
    let module: T | undefined
    /// #if MODE === 'esm'
    = (await import(pathToFileURL(absPath).toString())).default
    /// #elif MODE === 'cjs'
    = require(absPath).default; // eslint-disable-line
    /// #endif
    if (module === undefined) {
        return Err(SernError.UndefinedModule);
    }
    try {
        module = new (module as unknown as new () => T)();
    } catch {}
    return Ok({ module, absPath });
}

/**
 * a directory string is converted into a stream of modules.
 * starts the stream of modules that sern needs to process on init
 * @returns {Observable<{ mod: Module; absPath: string; }[]>} data from command files
 * @param commandDir
 */
export function buildModuleStream<T>(commandDir: string): Observable<
    Result<ImportPayload<T>, SernError>
> {
    const commands = getCommands(commandDir);
    return from(commands).pipe(
        mergeMap(defaultModuleLoader<T>)
    );
}


export function fullPathFrom(dir: string) {
    return join(process.cwd(), dir);
}



export function getCommands(dir: string): string[] {
    return readPath(fullPathFrom(dir));
}
