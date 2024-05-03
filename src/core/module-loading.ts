import path from 'node:path';
import assert from 'assert';
import { existsSync } from 'fs';


export const parseCallsite = (site: string) => {
    const pathobj = path.parse(site.replace(/file:\\?/, "")
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
 *
 * //or
 * exports.default = commandModule({ })
 * ```
 * esm javascript, typescript, and commonjs typescript
 * export default commandModule({})
 */
//async function importModule<T>(absPath: string) {
//    let fileModule = await import(absPath);
//
//    let commandModule = fileModule.default;
//
//    assert(commandModule , `No export @ ${absPath}. Forgot to ignore with "!"? (!${path.basename(absPath)})?`);
//    if ('default' in commandModule) {
//        commandModule = commandModule.default;
//    }
//    return { module: commandModule } as T;
//}


export const fmtFileName = (fileName: string) => path.parse(fileName).name;

export const filename = (p: string) => fmtFileName(path.basename(p));

