import * as Files from './readFile';
import { basename } from 'path';
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