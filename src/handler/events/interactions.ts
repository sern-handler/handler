import { Interaction } from 'discord.js';
import {
    catchError,
    concatMap,
    finalize,
    merge,
} from 'rxjs';
import { SernError } from '../../core/structures/errors';
import { executeModule, makeModuleExecutor } from './observableHandling';
import { ErrorHandling, handleError } from '../../core/contracts/errorHandling';
import { SernEmitter, WebsocketStrategy } from '../../core';
import { sharedObservable } from '../../core/operators'
import { useContainerRaw } from '../../core/dependencies';
import type { Logging, ModuleManager } from '../../core/contracts';
import type { EventEmitter } from 'node:events';
import { isAutocomplete, isCommand, isMessageComponent, isModal } from '../../core/predicates';
import { createHandler } from './generic';


export function makeInteractionCreate([s, err, log, modules, client]: [
    SernEmitter,
    ErrorHandling,
    Logging | undefined,
    ModuleManager,
    EventEmitter
],
    platform: WebsocketStrategy 
) {
    const interactionStream$ = sharedObservable<Interaction>(client, platform.eventNames[0]);
    const handle = createHandler(interactionStream$, modules);
    const interactionHandler$ = merge(
        handle(isMessageComponent),
        handle(isAutocomplete),
        handle(isCommand),
        handle(isModal)
    );
    return interactionHandler$
        .pipe(
            makeModuleExecutor(module => {
                s.emit('module.activate', SernEmitter.failure(module, SernError.PluginFailure));
            }),
            concatMap(module => executeModule(s, module)),
            catchError(handleError(err, log)),
            finalize(() => {
                log?.info({
                    message: 'interaction stream closed or reached end of lifetime',
                });
                useContainerRaw()
                    ?.disposeAll()
                    .then(() => log?.info({ message: 'Cleaning container and crashing' }));
            }),
        )
        .subscribe();
}
