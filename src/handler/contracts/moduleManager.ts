import type {
    CommandModuleDefs,
} from '../../types/module';
import type { CommandType } from '../structures/enums';
import type { CommandModule } from '../../types/module';
import type { ModuleStore } from '../structures/moduleStore';
import type { Client } from 'discord.js';

export abstract class ModuleManager<T extends ModuleStore = ModuleStore> {
     constructor(
        protected readonly _client: Client,
        protected readonly _moduleStore : T
    ) {}
    protected abstract getModule<T extends CommandType>(type: T, name: string) : CommandModuleDefs[T] | undefined
    protected abstract setModule<T extends CommandType>(type : T, value: CommandModule) : void
}

export interface ModuleManagerConstructor<T extends ModuleStore> {
    new (client : Client, moduleStore: T) : ModuleManager<T>
}
export default ModuleManager;

export type ModuleConfig<T extends ModuleStore = ModuleStore> = ( client : Client ) => ModuleManager<T>