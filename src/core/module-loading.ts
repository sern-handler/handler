import { Result } from 'ts-results-es';
import { type Observable, from, mergeMap, ObservableInput } from 'rxjs';
import { readdir, stat } from 'fs/promises';
import { basename, extname, join, resolve } from 'path';
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

    assert(
        module,
        'Found no default export for command module at ' +
            absPath +
            'Forgot to ignore with "!"? (!filename.ts)?',
    );
    if ('default' in module) {
        module = module.default;
    }
    return Result.wrap(() => module.getInstance()).unwrapOr(module) as T;
}
export async function defaultModuleLoader<T extends Module>(absPath: string): ModuleResult<T> {
    let module = await importModule<T>(absPath);
    assert.ok(
        module,
        "Found an undefined module. Forgot to ignore it with a '!' ie (!filename.ts)?",
    );
    return { module, absPath };
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
): Observable<ImportPayload<T>> {
    return from(input).pipe(mergeMap(defaultModuleLoader<T>));
}

export const getFullPathTree = (dir: string, mode: boolean) => readPaths(resolve(dir), mode);

export const filename = (path: string) => fmtFileName(basename(path));

const isSkippable = (filename: string) => {
    //empty string is for non extension files (directories)
    const validExtensions = ['.js', '.cjs', '.mts', '.mjs', 'cts', ''];
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
async function* readPaths(dir: string, shouldDebug: boolean): AsyncGenerator<string> {
    try {
        const files = await readdir(dir);
        for (const file of files) {
            const { fullPath, fileStats, base } = await deriveFileInfo(dir, file);
            if (fileStats.isDirectory()) {
                //Todo: refactor so that i dont repeat myself for files (line 71)
                if (isSkippable(base)) {
                    if (shouldDebug) console.info(`ignored directory: ${fullPath}`);
                } else {
                    yield* readPaths(fullPath, shouldDebug);
                }
            } else {
                if (isSkippable(base)) {
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

const requir = createRequire(import.meta.url);

export function loadConfig(wrapper: Wrapper | 'file'): Wrapper {
    if (wrapper === 'file') {
        console.log('Experimental loading of sern.config.json');
        const config = requir(resolve('sern.config.json')) as {
            language: string;
            defaultPrefix?: string;
            mode?: 'PROD' | 'DEV';
            paths: {
                base: string;
                commands: string;
                events?: string;
            };
        };
        const makePath = (dir: keyof typeof config.paths) =>
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
            mode: config.mode,
        };
    }
    return wrapper;
}
