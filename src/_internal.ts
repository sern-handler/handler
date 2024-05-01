import type { Interaction } from 'discord.js';
import { mergeMap, merge, concatMap } from 'rxjs';
import { PayloadType } from './core/structures/enums';
import {
    isAutocomplete,
    isCommand,
    isMessageComponent,
    isModal,
    sharedEventStream,
    SernError,
    filterTap,
    resultPayload,
    type _Module,
} from './core/_internal';
import { createInteractionHandler, executeModule, makeModuleExecutor } from './handlers/event-utils';
import type { Emitter, ErrorHandling, Logging } from './core/interfaces'
import { Services } from './core/ioc/dependency-injection';

export function interactionHandler(client: Emitter,
                                   emitter: Emitter,
                                   log: Logging,
                                   err: ErrorHandling,
                                   modules: Map<string, _Module>) {
    const interactionStream$ = sharedEventStream<Interaction>(client, 'interactionCreate');
    const handle = createInteractionHandler(interactionStream$, modules);

    const interactionHandler$ = merge(handle(isMessageComponent),
                                      handle(isAutocomplete), 
                                      handle(isCommand), 
                                      handle(isModal));
    return interactionHandler$
        .pipe(filterTap(e => emitter.emit('warning', resultPayload(PayloadType.Warning, undefined, e))),
              concatMap(makeModuleExecutor(module => 
                emitter.emit('module.activate', resultPayload(PayloadType.Failure, module, SernError.PluginFailure)))),
              mergeMap(payload => executeModule(emitter, log, err, payload)));
}

export const __dependencies = () => 
    Services('@sern/emitter', 
             '@sern/errors',
             '@sern/logger',
             '@sern/client');
