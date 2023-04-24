import type { Dependencies } from '../../types/handler';

/**
 * @since 1.0.0
 * An object to be passed into Sern#init() function.
 * @typedef {object} Wrapper
 */
interface Wrapper {
    /**
      * @deprecated
      * This will be moved to a new field in 3.0.0
      */
    readonly defaultPrefix?: string;
    readonly commands: string;
    readonly events?: string;
    readonly containerConfig: {
        get: (...keys: (keyof Dependencies)[]) => unknown[];
    };
}
export default Wrapper;
