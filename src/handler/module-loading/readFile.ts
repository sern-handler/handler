import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { type Observable, from, mergeMap, filter} from 'rxjs';
import { SernError } from '../structures/errors';
import { type Result, Err, Ok } from 'ts-results-es';

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
export const isStoreable = (n: string) => n.indexOf(".lazy.", n.length-9) === -1;



async function defaultModuleLoader<T>(absPath: string) {
    // prettier-ignore
    let module: T | undefined
    /// #if MODE === 'esm'
    = (await import(`file:///` + absPath)).default
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
    Result<
        {
            module: T;
            absPath: string;
        },
        SernError
    >
> {
    const commands = getCommands(commandDir);
    return from(commands).pipe(
        filter(isStoreable),
        mergeMap(defaultModuleLoader<T>)
    );
}

export function getCommands(dir: string): string[] {
    return readPath(join(process.cwd(), dir));
}
