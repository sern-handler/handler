import ModuleManager from '../contracts/moduleManager';
import type { CommandModule, CommandModuleDefs } from '../../types/module';
import type { CommandType } from './enums';

export class DefaultModuleManager extends ModuleManager {
    getModule<T extends CommandType>(type: T, name: string): CommandModuleDefs[T] | undefined {
        return undefined;
    }

    setModule<T extends CommandType>(type: T, value: CommandModule): void {
    }

}


