import { catchError, concatMap, filter, from, iif, map, of, tap, toArray } from 'rxjs';
import { buildData } from '../utilities/readFile';
import { controller } from '../sern';
import type { DefinedCommandModule, DefinedEventModule, Dependencies } from '../../types/handler';
import { PayloadType, PluginType } from '../structures/enums';
import type Wrapper from '../structures/wrapper';
import { isDiscordEvent, isExternalEvent, isSernEvent } from '../utilities/predicates';
import { errTap, processPlugins, resolvePlugins } from './observableHandling';
import type { AnyModule, EventModule } from '../../types/module';
import type { EventEmitter } from 'events';
import type SernEmitter from '../sernEmitter';
import { nameOrFilename, reducePlugins } from '../utilities/functions';
import { match } from 'ts-pattern';
import { discordEventDispatcher, externalEventDispatcher, sernEmitterDispatcher } from './dispatchers';
import type { ErrorHandling, Logging } from '../contracts';
import { SernError } from '../structures/errors';
import { handleError } from '../contracts/errorHandling';
import type { Awaitable } from 'discord.js';
import type { Result } from 'ts-results-es';

/**
 * Utility function to process command plugins for all Modules
 * @param payload
 */
export function processCommandPlugins<T extends DefinedCommandModule | DefinedEventModule>(
    payload: { mod: T; absPath: string },
): {type: PluginType.Command, execute: Awaitable<Result<void,void>>}[]  {
    return payload.mod.plugins.map(plug => ({
        type: plug.type,
        execute: plug.execute(payload as any, controller),
    }));
}

export function processEvents({ containerConfig, events }: Wrapper) {
    const [
        client,
        error,
        sernEmitter,
        logging
    ] = containerConfig.get('@sern/client', '@sern/errors', '@sern/emitter', '@sern/logger') as [EventEmitter, ErrorHandling, SernEmitter, Logging?];
    const lazy = (k: string) => containerConfig.get(k as keyof Dependencies)[0];
    const eventStream$ = eventObservable$(events!, sernEmitter);
    const emitSuccess$ = (mod: AnyModule) =>
        of({ type: PayloadType.Failure, module: mod, reason: SernError.PluginFailure })
        .pipe(tap( it => sernEmitter.emit('module.register', it)));
    const emitFailure$ = (mod: AnyModule) =>
        of({ type: PayloadType.Success, module: mod, } as const)
        .pipe(tap(it => sernEmitter.emit('module.register', it)));
    const eventCreation$ = eventStream$.pipe(
        map(({ mod, absPath }) => ({
            mod : {
                name: nameOrFilename(mod.name, absPath),
                ...mod,
            } as DefinedEventModule,
            absPath
        })),
        concatMap(processPlugins),
        concatMap(resolvePlugins),
        //Reduces pluginRes (generated from above) into a single boolean
        concatMap(s => from(s.pluginRes)
            .pipe(
                map(pl => pl.execute),
                toArray(),
                reducePlugins,
                map(success => ({ success, mod: s.mod }))
            )),
        concatMap(({ success, mod }) =>
            iif(() => success, emitFailure$(mod), emitSuccess$(mod))
                .pipe(
                    filter(res => res.type === PayloadType.Success),
                    map(() => mod)
                )
        ),
    );
    eventCreation$.subscribe(e => {
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
                        if(success)
                            payload.cmd.execute(event as never);
                    }), catchError(handleError(error, logging)))
                ),
            ).subscribe();
    });
}

function eventObservable$(events: string, emitter: SernEmitter) {
        return buildData<EventModule>(events)
            .pipe(
                errTap(reason =>
                   emitter.emit('module.register', {
                        type: PayloadType.Failure,
                        module: undefined,
                        reason,
                    }),
                ),
            );
}
