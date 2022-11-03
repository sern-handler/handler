import type { CommandModuleDefs } from '../../types/module';
import type { CommandType } from '../structures/enums';
import type { ModuleStore } from '../structures/moduleStore';


export interface ModuleManager {
    get<T extends CommandType>(strat : (ms: ModuleStore) => CommandModuleDefs[T] | undefined) : CommandModuleDefs[T] | undefined
    set(strat: (ms: ModuleStore) => void) : void
}

export class DefaultModuleManager implements ModuleManager {
    constructor(private moduleStore: ModuleStore) {}
    get<T extends CommandType>(strat: (ms: ModuleStore) => CommandModuleDefs[T] | undefined) {
        return strat(this.moduleStore);
    }

    set(strat: (ms: ModuleStore) => void) {
        strat(this.moduleStore);
    }
}
