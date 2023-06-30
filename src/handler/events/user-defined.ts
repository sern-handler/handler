import { ObservableInput, map, mergeAll } from 'rxjs';
import type { CommandModule, EventModule } from '../../core/types/modules';
import { EventType } from '../../core/structures';
import { SernError } from '../../core/structures/errors';
import { eventDispatcher } from './dispatchers';
import { buildModules, callInitPlugins, handleCrash } from './generic';
import { Service } from '../../core/ioc';
import { DependencyList, Processed } from '../types';

export function eventsHandler(
    [emitter, err, log, moduleManager, client]: DependencyList,
    allPaths: ObservableInput<string>,
) {
    //code smell
    const intoDispatcher = (e: Processed<EventModule | CommandModule>) => {
        switch (e.type) {
            case EventType.Sern:
                return eventDispatcher(e, emitter);
            case EventType.Discord:
                return eventDispatcher(e, client);
            case EventType.External:
                return eventDispatcher(e, Service(e.emitter));
            default:
                throw Error(SernError.InvalidModuleType + ' while creating event handler');
        }
    };
    buildModules<EventModule>(allPaths, moduleManager)
        .pipe(
            callInitPlugins(emitter),
            map(intoDispatcher),
            /**
             * Where all events are turned on
             */
            mergeAll(),
            handleCrash(err, log),
        )
        .subscribe();
}
