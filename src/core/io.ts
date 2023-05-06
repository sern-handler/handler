import { Module } from "../types/module";
import { Result } from "ts-results-es";
import { Processed } from "../types/core";
import { SernError } from "./structures/errors";
import { readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { type Observable, from, mergeMap, ObservableInput } from 'rxjs';
import { defaultModuleLoader } from "./module-loading";

export const fmtFileName = (n: string) => n.substring(0, n.length - 3);
/**
 * a directory string is converted into a stream of modules.
 * starts the stream of modules that sern needs to process on init
 * @returns {Observable<{ mod: Module; absPath: string; }[]>} data from command files
 * @param commandDir
 */
export function buildModuleStream<T extends Module>(
    input: ObservableInput<string>
): Observable<Result<Processed<T>, SernError>> {
    return from(input).pipe(mergeMap(defaultModuleLoader<T>));
}

export function getCommands(dir: string) {
    return readPath(resolve(dir));
}

export function filename(path: string) {
    const i = path.lastIndexOf('/')
    return fmtFileName(path.substring(i))
}

async function* readPath(dir: string): AsyncGenerator<string> {
  try {
    const files = await readdir(dir);
    for (const file of files) {
      const fullPath = join(dir, file);
      const fileStats = await stat(fullPath);
      if (fileStats.isDirectory()) {
        yield* readPath(fullPath);
      } else {
        /// #if MODE === 'esm'
        yield 'file:///'+fullPath;
        /// #elif MODE === 'cjs'
        yield fullPath;
        /// #endif
      }
    }
  } catch (err) {
    throw err;
  }
}

//https://stackoverflow.com/questions/16697791/nodejs-get-filename-of-caller-function
export function filePath() {
    const err = new Error();

    Error.prepareStackTrace = (_, stack) => stack;

    const stack = err.stack as unknown as NodeJS.CallSite[];

    Error.prepareStackTrace = undefined;
    const path = stack[2].getFileName();
    if(path === null) {
        throw Error("Could not get the name of commandModule.")
    }
    return path;
}
