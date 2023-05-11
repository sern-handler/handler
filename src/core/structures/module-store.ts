import { CoreModuleStore } from "../contracts";

/*
 * @internal
 * Version 4.0.0 will internalize this api. Please refrain from using ModuleStore!
 */
export class ModuleStore implements CoreModuleStore {
    commands = new Map<string, string>();
}
