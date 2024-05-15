import { EventType, SernError } from '../core/structures/enums';
import { eventDispatcher } from './event-utils'
import type { EventModule,  Processed } from '../types/core-modules';
import * as Files from '../core/module-loading'
import type { UnpackedDependencies } from '../types/utility';

export default function(deps: UnpackedDependencies, eventDir: string) {
    //code smell
    const intoDispatcher = (e: { module: Processed<EventModule> }) => {
        switch (e.module.type) {
            case EventType.Sern:
                return eventDispatcher(e.module,  deps['@sern/emitter']);
            case EventType.Discord:
                return eventDispatcher(e.module,  deps['@sern/client']);
            case EventType.External:
                return eventDispatcher(e.module,  deps[e.module.emitter]);
            case EventType.Cron:
                //@ts-ignore TODO
                return eventDispatcher(e.module, deps['@sern/cron'])
            default:
                throw Error(SernError.InvalidModuleType + ' while creating event handler');
        }
    };
    Files.readRecursive(eventDir)
   //buildModules<EventModule>(allPaths)
//       pipe(
//            callInitPlugins(emitter),
//            map(intoDispatcher),
//            /**
//             * Where all events are turned on
//             */
//            mergeAll(),
//            handleCrash(err, emitter, log))
//        .subscribe();
}
