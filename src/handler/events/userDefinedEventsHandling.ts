import { catchError, concatMap, map, tap } from 'rxjs';
import { buildData } from '../utilities/readFile';
import { controller } from '../sern';
import type {
    DefinedCommandModule,
    DefinedEventModule, Dependencies,
} from '../../types/handler';
import { PayloadType } from '../structures/enums';
import type Wrapper from '../structures/wrapper';
import { isDiscordEvent, isExternalEvent, isSernEvent } from '../utilities/predicates';
import { errTap } from './observableHandling';
import type { EventModule } from '../../types/module';
import type { EventEmitter } from 'events';
import type SernEmitter from '../sernEmitter';
import { nameOrFilename } from '../utilities/functions';
import { match } from 'ts-pattern';
import { discordEventDispatcher, externalEventDispatcher, sernEmitterDispatcher } from './dispatchers';
import type { ErrorHandling, Logging } from '../contracts';
import { SernError } from '../structures/errors';
import { handleError } from '../contracts/errorHandling';

/**
 * Utility function to process command plugins for all Modules
 * @param payload
 */
export function processCommandPlugins<T extends DefinedCommandModule>(
    payload: { mod: T; absPath: string },
) {
    return payload.mod.plugins.map(plug => ({
        ...plug,
        name: plug?.name ?? 'Unnamed Plugin',
        description: plug?.description ?? '...',
        execute: plug.execute(payload, controller),
    }));
}

export function processEvents({ containerConfig, events }: Wrapper) {
    const [
        client,
        error,
        sernEmitter,
        logging
    ] = containerConfig.get('@sern/client', '@sern/errors', '@sern/emitter') as [EventEmitter, ErrorHandling, SernEmitter, Logging?];
    const lazy = (k: string) => containerConfig.get(k as keyof Dependencies)[0];
    const eventStream$ = eventObservable$(events!, sernEmitter);
    const normalize$ = eventStream$.pipe(
        map(({ mod, absPath }) => {
            return <DefinedEventModule>{
                name: nameOrFilename(mod.name, absPath),
                ...mod,
            };
        }),
    );
    normalize$.subscribe(e => {
        const payload = match(e)
            .when(isSernEvent, sernEmitterDispatcher(sernEmitter))
            .when(isDiscordEvent, discordEventDispatcher(client))
            .when(isExternalEvent, externalEventDispatcher(e => lazy(e.emitter)))
            .otherwise(() => error.crash(Error(SernError.InvalidModuleType)));
       payload
            .execute
            .pipe(
                concatMap(({event, executeEvent}) =>
                    executeEvent
                    .pipe( tap(success => {
                        if(success) {
                            //Safe because type checking previous and merging here
                            payload.cmd.execute(event as never);
                            sernEmitter.emit('module.activate',{ type:PayloadType.Success, module: payload.cmd });
                        } else {
                            sernEmitter.emit('module.activate', { type:PayloadType.Failure, module: payload.cmd, reason: SernError.PluginFailure });
                        }
                    }), catchError(handleError(error, logging)))
                ),
            ).subscribe();
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
