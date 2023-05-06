import { catchError, finalize, map, mergeAll, of } from 'rxjs';
import type { Dependencies, Processed, Wrapper } from '../../types/core';
import { callInitPlugins } from './observableHandling';
import type { CommandModule, EventModule } from '../../types/module';
import type { EventEmitter } from 'node:events';
import { SernEmitter } from '../../core';
import type { ErrorHandling, Logging } from '../../core/contracts';
import { EventType } from '../../core/structures';
import { SernError } from '../../core/structures/errors';
import { eventDispatcher } from './dispatchers';
import { handleError } from '../../core/contracts/errorHandling';
import { useContainerRaw } from '../../core/dependencies';
import { buildModules } from './generic';

export function makeEventsHandler(
    [s, err, log, client]: [SernEmitter, ErrorHandling, Logging | undefined, EventEmitter],
    eventsPath: string,
    containerGetter: Wrapper['containerConfig'],
) {
    const lazy = (k: string) => containerGetter.get(k as keyof Dependencies)[0];
    const intoDispatcher = (e: Processed<EventModule | CommandModule>) => {
        switch (e.type) {
            case EventType.Sern:
                return eventDispatcher(e, s);
            case EventType.Discord:
                return eventDispatcher(e, client);
            case EventType.External:
                return eventDispatcher(e, lazy(e.emitter));
            default:
                return err.crash(
                    Error(SernError.InvalidModuleType + ' while creating event handler'),
                );
        }
    };
    of(null)
        .pipe(
            buildModules(eventsPath, s),
            callInitPlugins({
                onStop: module =>
                    s.emit('module.register', SernEmitter.failure(module, SernError.PluginFailure)),
                onNext: ({ module }) => {
                    s.emit('module.register', SernEmitter.success(module));
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
