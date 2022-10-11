import type { RequiredDependencies } from '../../types/handler';

/**
 * An object to be passed into Sern#init() function.
 * @typedef {object} Wrapper
 */
interface Wrapper {
    readonly defaultPrefix?: string;
    readonly commands: string;
    readonly events?: string;
    readonly containerConfig : {
        containerGetter : (keys: [...(keyof RequiredDependencies)[]]) => object[];
    }
}

export default Wrapper;
