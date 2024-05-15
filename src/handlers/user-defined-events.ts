import { EventType, PayloadType, SernError } from '../core/structures/enums';
import { eventDispatcher, handleCrash } from './event-utils'
import { EventModule,  Module,  Processed } from '../types/core-modules';
import * as Files from '../core/module-loading'
import type { UnpackedDependencies } from '../types/utility';
import { resultPayload } from '../core/functions';
import { from, map, mergeAll } from 'rxjs';

const intoDispatcher = (deps: UnpackedDependencies) => 
    (module : EventModule) => {
        switch (module.type) {
            case EventType.Sern:
                return eventDispatcher(module,  deps['@sern/emitter']);
            case EventType.Discord:
                return eventDispatcher(module,  deps['@sern/client']);
            case EventType.External:
                return eventDispatcher(module,  deps[module.emitter]);
            case EventType.Cron:
                //@ts-ignore TODO
                return eventDispatcher(module, deps['@sern/cron'])
            default:
                throw Error(SernError.InvalidModuleType + ' while creating event handler');
        }
};

export default async function(deps: UnpackedDependencies, eventDir: string) {
    const eventModules: EventModule[] = [];
    for await (const path of Files.readRecursive(eventDir)) {
        const { module } = await Files.importModule<Module>(path);
        for(const plugin of module.plugins) {
            const res = await plugin.execute({ module, absPath: module.meta.absPath });
            if(res.isErr()) {
                deps['@sern/emitter'].emit('module.register', resultPayload(PayloadType.Failure, module, SernError.PluginFailure));
                throw Error("Plugin failed with controller.stop()");
            }
        }
        eventModules.push(module as EventModule);
    }
    from(eventModules)
        .pipe(map(intoDispatcher(deps)),
              /**
               * Where all events are turned on
               */
               mergeAll(),
               handleCrash(deps))
            .subscribe();
}
