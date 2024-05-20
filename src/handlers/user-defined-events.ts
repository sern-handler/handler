import { EventType,  SernError } from '../core/structures/enums';
import { callInitPlugins, eventDispatcher, handleCrash } from './event-utils'
import { EventModule,  Module  } from '../types/core-modules';
import * as Files from '../core/module-loading'
import type { UnpackedDependencies } from '../types/utility';
import { from, map, mergeAll } from 'rxjs';

const intoDispatcher = (deps: UnpackedDependencies) => 
    (module : EventModule) => {
        switch (module.type) {
            case EventType.Sern:
                return eventDispatcher(deps, module,  deps['@sern/emitter']);
            case EventType.Discord:
                return eventDispatcher(deps, module,  deps['@sern/client']);
            case EventType.External:
                return eventDispatcher(deps, module,  deps[module.emitter]);
            case EventType.Cron: {
                //@ts-ignore
                const cron = deps['@sern/cron'];
                cron.addCronModule(module);
                return eventDispatcher(deps, module, cron);
            }
            default: throw Error(SernError.InvalidModuleType + ' while creating event handler');
        }
};

export default async function(deps: UnpackedDependencies, eventDir: string) {
    const eventModules: EventModule[] = [];
    for await (const path of Files.readRecursive(eventDir)) {
        let { module } = await Files.importModule<Module>(path);
        await callInitPlugins(module, deps)
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
