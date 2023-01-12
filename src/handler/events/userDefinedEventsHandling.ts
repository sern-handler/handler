import { catchError, concatMap, map, tap } from 'rxjs';
import { buildData } from '../utilities/readFile';
import type { Dependencies, Processed } from '../../types/handler';
import { EventType } from '../structures/enums';
import type Wrapper from '../structures/wrapper';
import { errTap, scanModule } from './observableHandling';
import type { CommandModule, EventModule } from '../../types/module';
import type { EventEmitter } from 'events';
import SernEmitter from '../sernEmitter';
import { match } from 'ts-pattern';
import type { ErrorHandling, Logging } from '../contracts';
import { SernError } from '../structures/errors';
import { eventDispatcher } from './dispatchers';
import { handleError } from '../contracts/errorHandling';
import { defineAllFields } from './operators';


export function processEvents({ containerConfig, events }: Wrapper) {
    const [client, errorHandling, sernEmitter, logging] = containerConfig.get(
        '@sern/client',
        '@sern/errors',
        '@sern/emitter',
        '@sern/logger',
    ) as [EventEmitter, ErrorHandling, SernEmitter, Logging?];
    const lazy = (k: string) => containerConfig.get(k as keyof Dependencies)[0];
    const eventStream$ = eventObservable$(events!, sernEmitter);

    const eventCreation$ = eventStream$.pipe(
        defineAllFields(),
        concatMap( scanModule({
            onFailure: module => sernEmitter.emit('module.register',SernEmitter.success(module)),
            onSuccess: ( { module }) => {
                sernEmitter.emit('module.register', SernEmitter.failure(module, SernError.PluginFailure));
                return module;
            }
        })),
    );
    const intoDispatcher = (e: Processed<EventModule | CommandModule>) => match(e)
        .with({ type: EventType.Sern }, m => eventDispatcher(m, sernEmitter))
        .with({ type: EventType.Discord }, m => eventDispatcher(m, client))
        .with({ type: EventType.External }, m => eventDispatcher(m, lazy(m.emitter)))
        .otherwise(() => errorHandling.crash(Error(SernError.InvalidModuleType)));

    eventCreation$.pipe(
        map(intoDispatcher),
        /**
         * Where all events are turned on
         */
        tap(dispatcher => dispatcher.subscribe()),
        catchError(handleError(errorHandling, logging)),
    ).subscribe();
}

function eventObservable$(events: string, emitter: SernEmitter) {
    return buildData<EventModule>(events).pipe(
        errTap(reason => {
            emitter.emit('module.register', SernEmitter.failure(undefined, reason));
        }),
    );
}
