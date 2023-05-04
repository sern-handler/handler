import { catchError, finalize, map, mergeAll } from 'rxjs';
import * as Files from '../../core/module-loading';
import type { Processed, WebsocketDependencies } from '../../types/handler';
import { callInitPlugins } from './observableHandling';
import type { CommandModule, EventModule } from '../../types/module';
import type { EventEmitter } from 'events';
import SernEmitter from '../../core/sernEmitter';
import type { ErrorHandling, Logging } from '../../core/contracts';
import { SernError, EventType } from '../../core/structures';
import { eventDispatcher } from './dispatchers';
import { handleError } from '../../core/contracts/errorHandling';
import { errTap, fillDefaults } from '../../core/operators';
import { useContainerRaw } from '../../core/dependencies';
import { AnyWrapper } from '../../core/structures/wrapper';

export function makeEventsHandler(
    [s, err, log, client]: [SernEmitter, ErrorHandling, Logging | undefined, EventEmitter],
    eventsPath: string,
    containerGetter: AnyWrapper['containerConfig'],
) {
    const lazy = (k: string) => containerGetter.get(k as keyof WebsocketDependencies)[0];
    const eventStream$ = eventObservable(eventsPath, s);

    const eventCreation$ = eventStream$.pipe(
        map(fillDefaults),
        callInitPlugins({
            onStop: module =>
                s.emit('module.register', SernEmitter.failure(module, SernError.PluginFailure)),
            onNext: ({ module }) => {
                s.emit('module.register', SernEmitter.success(module));
                return module;
            },
        }),
    );
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
    eventCreation$
        .pipe(
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

function eventObservable(events: string, emitter: SernEmitter) {
    return Files.buildModuleStream<EventModule>(events).pipe(
        errTap(reason => {
            emitter.emit('module.register', SernEmitter.failure(undefined, reason));
        }),
    );
}
