import { Err, Ok, Result } from 'ts-results';
import type { possibleOutput } from '../../../types/handler';

/**
 * Wrapper type taking `Ok(T)` or `Err(possibleOutput)` e.g `Result<T, possibleOutput`
 */

export type ArgType<T> = Result<T, possibleOutput>;

/**
 * 
 * @param {string} arg - command arguments 
 * @param {possibleOutput} onFailure - if `Number.parseInt` returns NaN
 * @returns {ArgType<number>} Attempts to use `Number.parseInt()` on `arg`
 */

export function parseInt(arg: string, onFailure: possibleOutput): ArgType<number> {
    const val = Number.parseInt(arg);

    return val === NaN ? Err(onFailure) : Ok(val);
}

/**
 * @param {string} arg - command arguments 
 * @param {possibleOutput} onFailure - If cannot parse `arg` into boolean. 
 * @param { {yesRegex: RegExp, noRegex: RegExp} } regexes - default regexes: yes : `/^(?:y(?:es)?|👍)$/i`, no :  /^(?:n(?:o)?|👎)$/i 
 * @returns { ArgType<boolean> } attemps to parse `args` as a boolean
 */

export function parseBool(
    arg: string,
    onFailure: possibleOutput = `Cannot parse '${arg}' as a boolean`,
    regexes: {
        yesRegex: RegExp,
        noRegex: RegExp
    } = {
        yesRegex: /^(?:y(?:es)?|👍)$/i,
        noRegex: /^(?:n(?:o)?|👎)$/i
    }
): ArgType<boolean> {
    if (arg.match(regexes.yesRegex)) return Ok(true);
    if (arg.match(regexes.noRegex)) return Ok(false);

    return Err(onFailure);
}

/**
 * 
 * @param {string} arg - command arguments 
 * @param {string} sep - default separator = ' '
 * @returns {Ok<string[]>}
 */

export function toArr(arg: string, sep = ' '): ArgType<string[]> {
    return Ok(arg.split(sep));
}

/**
 * 
 * @param {string} arg - command arguments 
 * @param {possibleOutput} onFailure - delegates `Utils.parseInt` 
 * @returns {ArgType<number>}
 */

export function toPositiveInt(arg: string, onFailure: possibleOutput): ArgType<number> {
    return parseInt(arg, onFailure).andThen(num => Ok(num > 0 ? num : -num));
}

/**
 * 
 * @param {string} arg - command arguments 
 * @param {possibleOutput} onFailure - delegates `parseInt` 
 * @returns {ArgType<number>}
 */
export function toNegativeInt(arg: string, onFailure: possibleOutput): ArgType<number> {
    return parseInt(arg, onFailure).andThen(num => Ok(num > 0 ? -num : num));
}
