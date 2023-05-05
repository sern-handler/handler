import type { ModuleStore } from '../structures';
/**
 * @since 2.0.0
 */
export interface ModuleManager {
    get(id: string): string | undefined;
    set(id: string, path: string): void;
}
/**
 * @since 2.0.0
 */
export class DefaultModuleManager implements ModuleManager {
    constructor(private moduleStore: ModuleStore) {}
    get(id: string) {
        return this.moduleStore.Commands.get(id);
    }
    set(id: string, path: string): void {
        this.moduleStore.Commands.set(id, path)
    }

}

