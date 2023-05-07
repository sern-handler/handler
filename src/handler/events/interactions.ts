import { Interaction } from 'discord.js';
import { catchError, concatMap, finalize, merge } from 'rxjs';
import { SernError } from '../../core/structures/errors';
import { handleError } from '../../core/contracts/error-handling';
import { SernEmitter } from '../../core';
import { sharedObservable } from '../../core/operators';
import { useContainerRaw } from '../../core/dependencies';
import { isAutocomplete, isCommand, isMessageComponent, isModal } from '../../core/predicates';
import { createInteractionHandler, executeModule, makeModuleExecutor } from './generic';
import { DependencyList } from '../../types/core';

export function makeInteractionCreate([s, err, log, modules, client]: DependencyList ) {
    const interactionStream$ = sharedObservable<Interaction>(client, 'interactionCreate');
    const handle = createInteractionHandler<Interaction>(interactionStream$, modules);
    const interactionHandler$ = merge(
        handle(isMessageComponent),
        handle(isAutocomplete),
        handle(isCommand),
        handle(isModal),
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
