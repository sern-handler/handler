import * as Files from '../module-loading/readFile';
import { basename } from 'path';
import { Err, Ok } from 'ts-results-es';
/**
 *
 * @param modName
 * @param absPath
 */
export function nameOrFilename(modName: string | undefined, absPath: string) {
    return modName ?? Files.fmtFileName(basename(absPath));
}

//function wrappers for empty ok / err
export const ok = () => Ok.EMPTY;
export const err = () => Err.EMPTY;

export function partition<T, V>(arr: (T & V)[], condition: (e: T & V) => boolean): [T[], V[]] {
    const t: T[] = [];
    const v: V[] = [];
    for (const el of arr) {
        if (condition(el)) {
            t.push(el as T);
        } else {
            v.push(el as V);
        }
    }
    return [t, v];
}
