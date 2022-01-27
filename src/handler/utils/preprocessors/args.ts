import { Err, Ok, Result } from "ts-results";
import type { possibleOutput } from "../../../types/handler/handler";


export namespace Utils {
    /**
     * Wrapper type taking `Ok(T)` or `Err(possibleOutput)` e.g `Result<T, possibleOutput`
     */
    type ArgType<T> = Result<T, possibleOutput>
    /**
     * 
     * @param {string} arg 
     * @param {possibleOutput} onFailure 
     * @returns {ArgType<number>} Attempts to use `Number.parseInt()` on `arg`
     */
    export function parseInt(arg: string, onFailure: possibleOutput): ArgType<number> {
        const val = Number.parseInt(arg);
        return val === NaN ? Err(onFailure) : Ok(val);
    }
    /**
     * 
     * @param {string} arg 
     * @param {possibleOutput} onFailure 
     * @param { {yesRegex: RegExp, noRegex: RegExp} } regexes 
     * @returns { ArgType<boolean> } attemps to parse `args` as a boolean
     */
    export function parseBool(
        arg: string,
        onFailure: possibleOutput = `Cannot parse ${arg} as a boolean`,
        regexes : {yesRegex: RegExp, noRegex: RegExp} = {yesRegex : /(yes|y|👍)/gi, noRegex : /(no|n|👎)/gi}
        ): ArgType<boolean> {

        if(arg.match(regexes.yesRegex)) {
            return Ok(true);
        }
        if(arg.match(regexes.noRegex)) {
            return Ok(false)
        }
        return Err(onFailure)        
    }
    
}


