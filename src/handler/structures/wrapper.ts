import type { Dependencies } from '../../types/handler';

/**
 * An object to be passed into Sern#init() function.
 * @typedef {object} Wrapper
 */
interface Wrapper {
    readonly defaultPrefix?: string;
    readonly commands: string;
    readonly events?: string;
    readonly containerConfig : {
        get: (...keys: (keyof Dependencies)[]) => unknown[];
    }
}
export default Wrapper;
