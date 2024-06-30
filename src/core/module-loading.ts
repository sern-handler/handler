import path from 'node:path';
import { existsSync } from 'node:fs';
import { readdir } from 'fs/promises';
import assert from 'node:assert';
import * as Id from './id'
import { Module } from '../types/core-modules';

export const parseCallsite = (site: string) => {
    const pathobj = path.posix.parse(site.replace(/file:\\?/, "")
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
             path: 'file://'+newPath };
}


/**
 * Import any module based on the absolute path.
 * This can accept four types of exported modules
 * commonjs, javascript :
 * ```js
 * exports = commandModule({ })
 * //or
 * exports.default = commandModule({ })
 * ```
 * esm javascript, typescript, and commonjs typescript
 * export default commandModule({})
 */
export async function importModule<T>(absPath: string) {
    let fileModule = await import(absPath);

    let commandModule: Module = fileModule.default;

    assert(commandModule , `No default export @ ${absPath}`);
    if ('default' in commandModule) {
        commandModule = commandModule.default as Module;
    }
    const p = path.parse(absPath)
    commandModule.name ??= p.name; commandModule.description ??= "...";
    commandModule.meta = {
        id: Id.create(commandModule.name, commandModule.type),
        absPath,
    };
    return { module: commandModule as T };
}


export async function* readRecursive(dir: string): AsyncGenerator<string> {
    const files = await readdir(dir, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.posix.join(dir, file.name);
        if (file.isDirectory()) {
            if (!file.name.startsWith('!')) {
                yield* readRecursive(fullPath);
            }
        } else if (!file.name.startsWith('!')) {
            yield "file:///"+path.resolve(fullPath);
        }
    }
}


