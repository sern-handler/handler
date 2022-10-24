import type { Dependencies } from '../../types/handler';
import { makeDependencies } from '../sern';

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
interface P extends Dependencies {
    a : () => ''
}
const useDeps = makeDependencies<P>(root => {
    return root.add({
        a : () => ''
    });
});
const p : Wrapper = {
    commands: 'hello',
    containerConfig : {
        get: useDeps
    }
};
export default Wrapper;
