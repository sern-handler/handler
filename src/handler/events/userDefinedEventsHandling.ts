import { catchError, concatMap, filter, from, iif, map, of, tap, toArray } from 'rxjs';
import { buildData } from '../utilities/readFile';
import type { DefinedCommandModule, DefinedEventModule, Dependencies } from '../../types/handler';
import { PayloadType } from '../structures/enums';
import type Wrapper from '../structures/wrapper';
import { isDiscordEvent, isExternalEvent, isSernEvent } from '../utilities/predicates';
import { errTap, processPlugins, resolvePlugins } from './observableHandling';
import type { AnyModule, EventModule } from '../../types/module';
import type { EventEmitter } from 'events';
import type SernEmitter from '../sernEmitter';
import { nameOrFilename, reducePlugins } from '../utilities/functions';
import { match } from 'ts-pattern';
import {
    discordEventDispatcher,
    externalEventDispatcher,
    sernEmitterDispatcher,
} from './dispatchers';
import type { ErrorHandling, Logging } from '../contracts';
import { SernError } from '../structures/errors';
import { handleError } from '../contracts/errorHandling';

/**
 * Utility function to process command plugins for all Modules
 * @param payload
 */
export function processCommandPlugins<
    T extends DefinedCommandModule | DefinedEventModule,
>(payload: {
    module: T;
    absPath: string;
}) {
    return payload.module.plugins.map(plug => ({
        type: plug.type,
        execute: plug.execute(payload),
    }));
}

export function processEvents({ containerConfig, events }: Wrapper) {
    const [client, error, sernEmitter, logging] = containerConfig.get(
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
        map(({ module, absPath }) => ({
            module: {
                name: nameOrFilename(module.name, absPath),
                ...module,
            } as DefinedEventModule,
            absPath,
        })),
        concatMap(processPlugins),
        concatMap(resolvePlugins),
        //Reduces pluginRes (generated from above) into a single boolean
        concatMap(({ pluginRes, module }) =>
            from(pluginRes).pipe(
                map(pl => pl.execute),
                toArray(),
                reducePlugins,
                map(success => ({ success, module })),
            ),
        ),
        concatMap(({ success, module }) =>
            iif(() => success, emitFailure$(module), emitSuccess$(module)).pipe(
                filter(res => res.type === PayloadType.Success),
                map(() => module),
            ),
        ),
    );
    eventCreation$.subscribe(e => {
        const payload = match(e)
            .when(isSernEvent, sernEmitterDispatcher(sernEmitter))
            .when(isDiscordEvent, discordEventDispatcher(client))
            .when(
                isExternalEvent,
                externalEventDispatcher(e => lazy(e.emitter)),
            )
            .otherwise(() => error.crash(Error(SernError.InvalidModuleType)));
        payload.execute
            .pipe(
                concatMap(({ event, executeEvent }) =>
                    executeEvent.pipe(
                        tap(success => {
                            if (success) {
                                if (Array.isArray(event)) {
                                    payload.cmd.execute(...event);
                                } else {
                                    payload.cmd.execute(event as never);
                                }
                            }
                        }),
                        catchError(handleError(error, logging)),
                    ),
                ),
            )
            .subscribe();
    });
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
