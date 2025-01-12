import { EventType,  SernError } from '../core/structures/enums';
import { callInitPlugins } from './event-utils'
import { EventModule,  Module  } from '../types/core-modules';
import * as Files from '../core/module-loading'
import type { UnpackedDependencies } from '../types/utility';
import type { Emitter } from '../core/interfaces';
import { inspect } from 'util'
import { resultPayload } from '../core/functions';
import { Wrapper } from '../'

export default async function(deps: UnpackedDependencies, wrapper: Wrapper) {
    const eventModules: EventModule[] = [];
    for await (const path of Files.readRecursive(wrapper.events!)) {
        let { module } = await Files.importModule<Module>(path);
        await callInitPlugins(module, deps)
        eventModules.push(module as EventModule);
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

                //@ts-ignore
                if(!report.emit('error', resultPayload('failure', module, err))) {
                    logger?.error({ message: inspect(err) });
                }
            }
           
       }
       source.addListener(String(module.name!), execute)
    }
}

