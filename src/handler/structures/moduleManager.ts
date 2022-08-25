import type ModuleManager from '../contracts/moduleManager';
import { ModuleStore } from './moduleStore';
import type {
  CommandModuleDefs,
} from '../../types/module';
import type { CommandType } from './enums';


/**
 * The default ModuleManager which is provided with sern
 * enables getting and setting modules into the ModuleStore
 */
export class DefaultModulesManager implements ModuleManager {
    private moduleStore = new ModuleStore();

    getModule<T extends CommandType>(type: T): CommandModuleDefs[T] | undefined {
        return undefined;
    }

    setModule<T extends CommandType>(type: T) {
        return undefined;
    }


}
