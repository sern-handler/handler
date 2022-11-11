import * as Files from './readFile';
import { basename } from 'path';
import { Err, Ok } from 'ts-results-es';
/**
 * A function that returns whatever value is provided.
 * Used for singleton in iti
 * @param value
 */
export const _const = <T>(value: T) =>
    () =>
        value;
/**
 * A function that returns another function
 * Used for transient in iti
 * @param value
 */
export const transient = <T>( value : T) => () => _const(value);

export function nameOrFilename(modName: string | undefined, absPath: string) {
    return modName ?? Files.fmtFileName(basename(absPath));
}

//function wrappers for empty ok / err
export const ok = _const(Ok.EMPTY);
export const err = _const(Err.EMPTY);


export function partition<T, V>(arr: (T & V)[], condition: (e: (T & V)) => boolean) : [T[], V[]] {
    const t : T[] = [];
    const v : V[] = [];
    for(const el of arr) {
        if(condition(el)) {
            t.push(el as T);
        } else {
            v.push(el as V);
        }
    }
    return [ t, v ];
}