import type {
    CommandModuleDefs,
} from '../../types/module';
import type { CommandType } from '../structures/enums';
import type { CommandModule } from '../../types/module';
import type { ModuleStore } from '../structures/moduleStore';
import type { ScopedPlugin } from '../../types/handler';


export interface ModuleManager extends ScopedPlugin {
    readonly moduleStore : ModuleStore;
    getModule<T extends CommandType>(type: T, name: string) : CommandModuleDefs[T] | undefined
    setModule<T extends CommandType>(type : T, value: Required<CommandModule>) : void
}

