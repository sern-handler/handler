import type { CommandModuleDefs } from '../../types/module';
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
