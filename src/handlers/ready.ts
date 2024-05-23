import * as Files from '../core/module-loading'
import { once } from 'node:events';
import { resultPayload } from '../core/functions';
import { PayloadType } from '..';
import { CommandType } from '../core/structures/enums';
import { Module } from '../types/core-modules';
import { UnpackedDependencies } from '../types/utility';
import { callInitPlugins } from './event-utils';

export default async function(dir: string, deps : UnpackedDependencies) {
    const { '@sern/client': client,
            '@sern/logger': log,
            '@sern/emitter': sEmitter,
            '@sern/modules': commands } = deps;
    log?.info({ message: "Waiting on discord client to be ready..." })
    await once(client, "ready");
    log?.info({ message: "Client signaled ready, registering modules" });

    // https://observablehq.com/@ehouais/multiple-promises-as-an-async-generator
    // possibly optimize to concurrently import modules
    for await (const path of Files.readRecursive(dir)) {
        let { module } = await Files.importModule<Module>(path);
        const validType = module.type >= CommandType.Text && module.type <= CommandType.ChannelSelect;
        if(!validType) {
            throw Error(`Found ${module.name} at ${module.meta.absPath}, which has incorrect \`type\``);
        }
        const resultModule = await callInitPlugins(module, deps, true);
        // FREEZE! no more writing!!
        commands.set(resultModule.meta.id, Object.freeze(resultModule));
        sEmitter.emit('module.register', resultPayload(PayloadType.Success, resultModule));
    }
    sEmitter.emit('modulesLoaded');
}
