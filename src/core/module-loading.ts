import { SernError } from './structures/errors';
import { type Result, Err, Ok } from 'ts-results-es';
import { Processed } from '../types/core';
import { Module } from '../types/module';
import * as assert from 'node:assert'
import util from 'node:util'
import { type Observable, from, mergeMap, ObservableInput } from 'rxjs';
import { readdir, stat } from 'fs/promises';
import { basename, join, resolve } from 'path';

export type ModuleResult<T> = Promise<Result<Processed<T>, SernError>> 
export type Loader<T> = (absPath: string) => ModuleResult<T>
export async function importModule<T>(absPath: string) {
    /// #if MODE === 'esm'
    return (await import(absPath)).default as T
    /// #elif MODE === 'cjs'
    return require(absPath).default as T; // eslint-disable-line
    /// #endif
}
export async function defaultModuleLoader<T extends Module>(
    absPath: string,
): ModuleResult<T> {
    // prettier-ignore
    const module = await importModule<T>(absPath);
    if (module === undefined) {
       return Err(SernError.UndefinedModule);
    }
    checkIsProcessed(module)
    return Ok(module);
}

function checkIsProcessed<T extends Module>(m: T): asserts m is Processed<T> {
    assert.ok(m.name !== undefined, `name is not defined for ${util.format(m)}`)
}


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
    return fmtFileName(basename(path))
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
    return path; }
