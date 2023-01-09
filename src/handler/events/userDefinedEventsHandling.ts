import { catchError, concatMap, filter, from, iif, map, of, tap, toArray } from 'rxjs';
import { buildData } from '../utilities/readFile';
import type { AnyDefinedModule, DefinedCommandModule, DefinedEventModule, Dependencies } from '../../types/handler';
import { EventType, PayloadType } from '../structures/enums';
import type Wrapper from '../structures/wrapper';
import { defineAllFields$, errTap, processPlugins, reduceResults$, resolveInitPlugins$ } from './observableHandling';
import type { AnyModule, EventModule } from '../../types/module';
import type { EventEmitter } from 'events';
import type SernEmitter from '../sernEmitter';
import { match } from 'ts-pattern';
import type { ErrorHandling, Logging } from '../contracts';
import { SernError } from '../structures/errors';
import { eventDispatcher } from './dispatchers';
import { handleError } from '../contracts/errorHandling';

/**
 * Utility function to process command plugins for all Modules
 * @param payload
 */
export function processCommandPlugins<T extends AnyDefinedModule>(
    payload: { module: T; absPath: string; }
) {
    return payload.module.plugins.map(plug => plug.execute(payload));
}

export function processEvents({ containerConfig, events }: Wrapper) {
    const [client, errorHandling, sernEmitter, logging] = containerConfig.get(
        '@sern/client',
        '@sern/errors',
        '@sern/emitter',
        '@sern/logger',
    ) as [EventEmitter, ErrorHandling, SernEmitter, Logging?];
    const lazy = (k: string) => containerConfig.get(k as keyof Dependencies)[0];
    const eventStream$ = eventObservable$(events!, sernEmitter);
    const emitSuccess$ = (module: AnyModule) =>
        of({ type: PayloadType.Failure, module, reason: SernError.PluginFailure }).pipe(
            tap(it => sernEmitter.emit('module.register', it)),
        );
    const emitFailure$ = (module: AnyModule) =>
        of({ type: PayloadType.Success, module } as const).pipe(
            tap(it => sernEmitter.emit('module.register', it)),
        );
    const eventCreation$ = eventStream$.pipe(
        defineAllFields$,
        concatMap(processPlugins),
        resolveInitPlugins$,
        concatMap(({ success, module }) =>
            iif(() => success, emitFailure$(module), emitSuccess$(module)).pipe(
                filter(res => res.type === PayloadType.Success),
                map(() => module),
            ),
        ),
    );
    const intoDispatcher = (e: DefinedEventModule | DefinedCommandModule) => match(e)
        .with({ type: EventType.Sern }, m => eventDispatcher(m, sernEmitter))
        .with({ type: EventType.Discord }, m => eventDispatcher(m, client))
        .with({ type: EventType.External }, m => eventDispatcher(m, lazy(m.emitter)))
        .otherwise(() => errorHandling.crash(Error(SernError.InvalidModuleType)));

    eventCreation$.pipe(
        map(intoDispatcher),
        tap(dispatcher => dispatcher.subscribe()),
        catchError(handleError(errorHandling, logging)),
    ).subscribe();
}

function eventObservable$(events: string, emitter: SernEmitter) {
    return buildData<EventModule>(events).pipe(
        errTap(reason =>
            emitter.emit('module.register', {
                type: PayloadType.Failure,
                module: undefined,
                reason,
            }),
        ),
    );
}
