import { Interaction } from 'discord.js';
import { concatMap, merge } from 'rxjs';
import { SernError } from '../../core/structures/errors';
import { SernEmitter } from '../../core';
import { sharedObservable } from '../../core/operators';
import { isAutocomplete, isCommand, isMessageComponent, isModal } from '../../core/predicates';
import { createInteractionHandler, executeModule, makeModuleExecutor } from './generic';
import { DependencyList } from '../types';

export function interactionHandler([emitter, , , modules, client]: DependencyList) {
    const interactionStream$ = sharedObservable<Interaction>(client, 'interactionCreate');
    const handle = createInteractionHandler(interactionStream$, modules);

    const interactionHandler$ = merge(
        handle(isMessageComponent),
        handle(isAutocomplete),
        handle(isCommand),
        handle(isModal),
    );
    return interactionHandler$.pipe(
        makeModuleExecutor(module => {
            emitter.emit('module.activate', SernEmitter.failure(module, SernError.PluginFailure));
        }),
        concatMap(payload => executeModule(emitter, payload)),
    );
}
