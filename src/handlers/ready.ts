import type { DependencyList } from '../types/ioc';
import * as Files from '../core/module-loading'
import { once } from 'events';
import { resultPayload } from '../core/functions';
import { PayloadType } from '..';
import { SernError } from '../core/structures/enums';
import { Module } from '../types/core-modules';

export default async function(dir: string, [sEmitter,, log, client, commands]: DependencyList) {
    log?.info({ message: "Waiting on discord client to be ready..." })
    await once(client, "ready");
    log?.info({ message: "Client signaled ready, registering modules" });
    for await (const path of Files.readRecursive(dir)) {
        const { module } = await Files.importModule<Module>(path);
        const validModuleType = module.type >= 0 && module.type <= 1 << 10;
        if(!validModuleType) {
            throw Error(`Found ${module.name} at ${module.meta.absPath}, which has an incorrect \`type\``);
        }
        for(const plugin of module.plugins) {
            const res = await plugin.execute({ module, absPath: module.meta.absPath });
            if(res.isErr()) { 
                sEmitter.emit('module.register', resultPayload(PayloadType.Failure, module, SernError.PluginFailure));
                throw Error("Plugin failed with controller.stop()");
            }
        }
        commands.set(module.meta.id, module);
        sEmitter.emit('module.register', resultPayload(PayloadType.Success, module));
    }
    sEmitter.emit('modulesLoaded');
}
