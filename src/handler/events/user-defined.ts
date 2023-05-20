import { ObservableInput, catchError, finalize, map, mergeAll, of } from 'rxjs';
import type { CommandModule, EventModule } from '../../core/types/modules';
import { SernEmitter } from '../../core';
import { EventType } from '../../core/structures';
import { SernError } from '../../core/structures/errors';
import { eventDispatcher } from './dispatchers';
import { buildModules, callInitPlugins } from './generic';
import { handleError } from '../../core/operators';
import { Service, useContainerRaw } from '../../core/ioc';
import { DependencyList, Processed } from '../types';

export function makeEventsHandler(
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
    of(null)
        .pipe(
            buildModules<Processed<EventModule>>(allPaths, emitter, moduleManager),
            callInitPlugins({
                onStop: module =>
                    emitter.emit(
                        'module.register',
                        SernEmitter.failure(module, SernError.PluginFailure),
                    ),
                onNext: ({ module }) => {
                    emitter.emit('module.register', SernEmitter.success(module));
                    return module;
                },
            }),
            map(intoDispatcher),
            /**
             * Where all events are turned on
             */
            mergeAll(),
            catchError(handleError(err, log)),
            finalize(() => {
                log?.info({ message: 'an event module reached end of lifetime' });
                useContainerRaw()
                    ?.disposeAll()
                    .then(() => {
                        log?.info({ message: 'Cleaning container and crashing' });
                    });
            }),
        )
        .subscribe();
}
