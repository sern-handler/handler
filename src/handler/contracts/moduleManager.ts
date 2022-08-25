import type {
    CommandModuleDefs,
} from '../../types/module';
import type { CommandType } from '../structures/enums';

interface ModuleManager {
    getModule<T extends CommandType>(type: T) : CommandModuleDefs[T] | undefined
    setModule<T extends CommandType>(type : T) : void
}

export default ModuleManager;
