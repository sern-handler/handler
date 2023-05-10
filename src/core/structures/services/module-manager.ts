import { ModuleStore } from "../../../shared";
import { ModuleManager } from "../../contracts";
import { importModule } from "../../module-loading";
import { CommandModule } from "../../types/modules";

/**
* @since 2.0.0
*/
export class DefaultModuleManager implements ModuleManager {
   constructor(private moduleStore: ModuleStore) {}

   remove(id: string): boolean {
       throw new Error('Method not implemented.');
   }

   get(id: string) {
       return this.moduleStore.get(id);
   }
   set(id: string, path: string): void {
       this.moduleStore.set(id, path);
   }
   //not tested
   getPublishableCommands(): Promise<CommandModule[]> {
       const entries = this.moduleStore.entries();
       const publishable = 0b000000110;
       return Promise.all(
           Array.from(entries)
               .filter(([id]) => (Number.parseInt(id.at(-1)!) & publishable) !== 0)
               .map(([, path]) => importModule<CommandModule>(path)),
       );
   }
}
