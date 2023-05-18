import { clazz } from '../../../handler/commands';
import { CoreModuleStore, ModuleManager } from '../../contracts';
import { importModule } from '../../module-loading';
import { CommandMeta, CommandModule, Module } from '../../types/modules';
/**
* @internal
* @since 2.0.0
* Version 4.0.0 will internalize this api. Please refrain from using ModuleStore!
*/
export class DefaultModuleManager implements ModuleManager {
   constructor(private moduleStore: CoreModuleStore) {}
   setMetadata(m: Module, c: CommandMeta): void {
        this.moduleStore.metadata.set(m, c);
   }

   getMetadata(m: Module): CommandMeta {
       const maybeModule = this.moduleStore.metadata.get(m);
       if(!maybeModule) {
            throw Error("Could not find metadata in store for " + maybeModule);
       }
       return maybeModule;
    }

   remove(id: string): boolean {
       throw new Error('Method not implemented.');
   }

   get(id: string) {
       return this.moduleStore.commands.get(id);
   }
   set(id: string, path: string): void {
       this.moduleStore.commands.set(id, path);
   }
   //not tested
   getPublishableCommands(): Promise<CommandModule[]> {
       const entries = this.moduleStore.commands.entries();
       const publishable = 0b000000110;
       return Promise.all(
           Array.from(entries)
               .filter(([id]) => !(Number.parseInt(id.at(-1)!) & publishable))
               .map(([, path]) =>  importModule<CommandModule>(path))
       );
   }
}
