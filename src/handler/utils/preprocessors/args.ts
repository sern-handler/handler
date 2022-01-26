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
     * @returns {ArgType<number>} Attempts to use Number.parseInt() on `arg`
     */
    export function parseInt(arg: string, onFailure: possibleOutput): ArgType<number> {
        const val = Number.parseInt(arg);
        return val === NaN ? Err(onFailure) : Ok(val);
    }
    
}


