import type { Nullish } from '../../types/handler';
import { Err, None, Ok, Result, Some } from 'ts-results-es';

/**
 * A function that returns whatever value is provided.
 * Used for singleton in iti
 * @param value
 */
export const constFn = <T>(value: T) =>
    () =>
        value;
/**
 * A function that returns another function
 * Used for transient in iti
 * @param value
 */
export const transient = <T>( value : T) => () => constFn(value);

export function resultFromNullish<T>(item : Nullish<T>) : Result<T, void> {
    if(item === undefined || item === null) {
        return Err.EMPTY;
    }
    return Ok(item);
}