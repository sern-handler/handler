import { catchError, finalize, map, tap, mergeAll } from 'rxjs';
import { buildData } from '../utilities/readFile';
import type { Dependencies, Processed } from '../../types/handler';
import { errTap, scanModule } from './observableHandling';
import type { CommandModule, EventModule } from '../../types/module';
import type { EventEmitter } from 'events';
import SernEmitter from '../sernEmitter';
import { match } from 'ts-pattern';
import type { ErrorHandling, Logging } from '../contracts';
import { SernError, EventType, type Wrapper } from '../structures';
import { eventDispatcher } from './dispatchers';
import { handleError } from '../contracts/errorHandling';
import { defineAllFields } from './operators';
import { useContainerRaw } from '../dependencies';

export function makeEventsHandler(
    [s, client, err, log]: [SernEmitter, EventEmitter, ErrorHandling, Logging | undefined],
    eventsPath: string,
    containerGetter: Wrapper['containerConfig'],
) {
    const lazy = (k: string) => containerGetter.get(k as keyof Dependencies)[0];
    const eventStream$ = eventObservable(eventsPath, s);

    const eventCreation$ = eventStream$.pipe(
        defineAllFields(),
        scanModule({
            onFailure: module => s.emit('module.register', SernEmitter.success(module)),
            onSuccess: ({ module }) => {
                s.emit('module.register', SernEmitter.failure(module, SernError.PluginFailure));
                return module;
            },
        }),
    );
    const intoDispatcher = (e: Processed<EventModule | CommandModule>) =>
        match(e)
            .with({ type: EventType.Sern }, m => eventDispatcher(m, s))
            .with({ type: EventType.Discord }, m => eventDispatcher(m, client))
            .with({ type: EventType.External }, m => eventDispatcher(m, lazy(m.emitter)))
            .otherwise(() => err.crash(Error(SernError.InvalidModuleType)));
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
    return buildData<EventModule>(events).pipe(
        errTap(reason => {
            emitter.emit('module.register', SernEmitter.failure(undefined, reason));
        }),
    );
}
