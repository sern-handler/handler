import type {
    CommandModuleDefs,
} from '../../types/module';
import type { CommandType } from '../structures/enums';
import type { ModuleStore } from '../structures/moduleStore';


export interface ModuleManager {
    getModule<T extends CommandType>(strat : (ms: ModuleStore) => CommandModuleDefs[T]) : CommandModuleDefs[T] | undefined
    setModule(strat: (ms: ModuleStore) => void) : void
}

export class DefaultModuleManager implements ModuleManager {
    constructor(private moduleStore: ModuleStore) {}
    getModule<T extends CommandType>(strat: (ms: ModuleStore) => CommandModuleDefs[T] | undefined) {
        return strat(this.moduleStore);
    }

    setModule(strat: (ms: ModuleStore) => void) {
        strat(this.moduleStore);
    }
}