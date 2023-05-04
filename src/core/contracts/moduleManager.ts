import type { CommandModule, CommandModuleDefs } from '../../types/module';
import type { CommandType, ModuleStore } from '../structures';
import type { Processed } from '../../types/handler';
/**
 * @since 2.0.0
 */
export interface ModuleManager {
    get<T extends CommandType>(
        strat: (ms: ModuleStore) => Processed<CommandModuleDefs[T]> | undefined,
    ): Processed<CommandModuleDefs[T]> | undefined;
    set(strat: (ms: ModuleStore) => void): void;
}
/**
 * @since 2.0.0
 */
export class DefaultModuleManager implements ModuleManager {
    constructor(private moduleStore: ModuleStore) {}
    get<T extends CommandType>(
        strat: (ms: ModuleStore) => Processed<CommandModuleDefs[T]> | undefined,
    ) {
        return strat(this.moduleStore);
    }

    set(strat: (ms: ModuleStore) => void): void {
        strat(this.moduleStore);
    }
}

export type ModuleGetter = (accessStrat: (ms: ModuleStore) => Processed<CommandModule>|undefined) => Processed<CommandModule>|undefined
export function createModuleGetter(moduleManager: ModuleManager) {
    return (accessStrat: (ms: ModuleStore) => Processed<CommandModule>|undefined) => { 
       return moduleManager.get(accessStrat) 
    }
}

export function createModuleInserter(moduleManager: ModuleManager) {
    return (insertStrat: (ms: ModuleStore) => void) => { 
       return moduleManager.set(insertStrat) 
    }
}
