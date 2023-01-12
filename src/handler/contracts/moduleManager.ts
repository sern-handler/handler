import type { CommandModuleDefs } from '../../types/module';
import type { CommandType } from '../structures/enums';
import type { ModuleStore } from '../structures/moduleStore';
import type { Processed } from '../../types/handler';

export interface ModuleManager {
    get<T extends CommandType>(
        strat: (ms: ModuleStore) => Processed<CommandModuleDefs[T]> | undefined,
    ): CommandModuleDefs[T] | undefined;
    set(strat: (ms: ModuleStore) => void): void;
}

export class DefaultModuleManager implements ModuleManager {
    constructor(private moduleStore: ModuleStore) {}
    get<T extends CommandType>(strat: (ms: ModuleStore) => Processed<CommandModuleDefs[T]> | undefined) {
        return strat(this.moduleStore);
    }

    set(strat: (ms: ModuleStore) => void): void {
        strat(this.moduleStore);
    }
}
