import { EventType,  SernError } from '../core/structures/enums';
import { callInitPlugins } from './event-utils'
import { EventModule  } from '../types/core-modules';
import * as Files from '../core/module-loading'
import type { UnpackedDependencies } from '../types/utility';
import type { Emitter } from '../core/interfaces';
import { inspect } from 'util'
import { resultPayload } from '../core/functions';
import type { Wrapper } from '../'

export default async function(deps: UnpackedDependencies, wrapper: Wrapper) {
    const eventModules: EventModule[] = [];
    const eventDirs = Array.isArray(wrapper.events!) ? wrapper.events! : [wrapper.events!];
    
    for (const dir of eventDirs) {
        for await (const path of Files.readRecursive(dir)) {
            let { module } = await Files.importModule<EventModule>(path);
            await callInitPlugins(module, deps)
            eventModules.push(module);
        }
    }

    const logger = deps['@sern/logger'], report = deps['@sern/emitter'];
    for (const module of eventModules) {
        let source: Emitter;

        switch (module.type) {
            case EventType.Sern:
                source=deps['@sern/emitter'];
                break
            case EventType.Discord:
                source=deps['@sern/client'];
                break
            case EventType.External:
                source=deps[module.emitter] as Emitter;
                break   
            default: throw Error(SernError.InvalidModuleType + ' while creating event handler');
        }
        if(!source && typeof source !== 'object') {
            throw Error(`${source} cannot be constructed into an event listener`)
        }
        
        if(!('addListener' in source && 'removeListener' in source)) {
            throw Error('source must implement Emitter')
        }
        const execute = async (...args: any[]) => {
            try {
                if(args) {
                    if('once' in module) { source.removeListener(String(module.name!), execute); }
                    await Reflect.apply(module.execute, null, args);
                }
            } catch(e) {
                const err = e instanceof Error ? e : Error(inspect(e, { colors: true }));
                if(!report.emit('error', resultPayload('failure', module, err))) {
                    logger?.error({ message: inspect(err) });
                }
            }
       }
       source.addListener(String(module.name!), execute)
    }
}

