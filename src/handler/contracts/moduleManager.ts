import type { CommandModuleDefs } from '../../types/module';
import type { CommandType, ModuleStore } from '../structures';
import type { Processed } from '../../types/handler';

export interface ModuleManager {
    get<T extends CommandType>(
        strat: (ms: ModuleStore) => Processed<CommandModuleDefs[T]> | undefined,
    ): Processed<CommandModuleDefs[T]> | undefined;
    set(strat: (ms: ModuleStore) => void): void;
}

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
