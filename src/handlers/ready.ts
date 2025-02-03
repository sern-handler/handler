import * as Files from '../core/module-loading'
import { once } from 'node:events';
import { createLookupTable, resultPayload } from '../core/functions';
import { CommandType } from '../core/structures/enums';
import { Module, SernOptionsData } from '../types/core-modules';
import type { UnpackedDependencies, Wrapper } from '../types/utility';
import { callInitPlugins } from './event-utils';
import { SernAutocompleteData } from '..';

export default async function(dirs: string | string[], deps : UnpackedDependencies) {
    const { '@sern/client': client,
            '@sern/logger': log,
            '@sern/emitter': sEmitter,
            '@sern/modules': commands } = deps;
    log?.info({ message: "Waiting on discord client to be ready..." })
    await once(client, "ready");
    log?.info({ message: "Client signaled ready, registering modules" });

    // https://observablehq.com/@ehouais/multiple-promises-as-an-async-generator
    // possibly optimize to concurrently import modules

    const directories = Array.isArray(dirs) ? dirs : [dirs];

    for (const dir of directories) {
        for await (const path of Files.readRecursive(dir)) {
            let { module } = await Files.importModule<Module>(path);
            const validType = module.type >= CommandType.Text && module.type <= CommandType.ChannelSelect;
            if(!validType) {
                throw Error(`Found ${module.name} at ${module.meta.absPath}, which has incorrect \`type\``);
            }
            const resultModule = await callInitPlugins(module, deps, true);

            if(module.type === CommandType.Both || module.type === CommandType.Slash) {
               const options  = (Reflect.get(module, 'options') ?? []) as SernOptionsData[];
               const lookupTable = createLookupTable(options)
               module.locals['@sern/lookup-table'] = lookupTable;
            }
            // FREEZE! no more writing!!
            commands.set(resultModule.meta.id, Object.freeze(resultModule));
            sEmitter.emit('module.register', resultPayload('success', resultModule));
        }
    }
    sEmitter.emit('modulesLoaded');
}
