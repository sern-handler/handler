import * as Files from '../module-loading/readFile';
import { basename } from 'path';
import { Err, Ok } from 'ts-results-es';
/**
 * A function that returns whatever value is provided.
 * Warning: this evaluates { @param value }. It does not defer a value.
 * @param value
 * @__PURE__
 */
// prettier-ignore
export const _const = <T>(value: T) => () => value;
/**
 *
 * @param modName
 * @param absPath
 */
export function nameOrFilename(modName: string | undefined, absPath: string) {
    return modName ?? Files.fmtFileName(basename(absPath));
}

//function wrappers for empty ok / err
export const ok = _const(Ok.EMPTY);
export const err = _const(Err.EMPTY);

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
