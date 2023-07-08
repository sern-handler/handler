import { Interaction } from 'discord.js';
import { concatMap, merge } from 'rxjs';
import { SernEmitter } from '../core';
import { 
    isAutocomplete,
    isCommand,
    isMessageComponent,
    isModal,
    sharedEventStream,
    SernError
} from '../core/_internal';
import { createInteractionHandler, executeModule, makeModuleExecutor, DependencyList } from './_internal';

export function interactionHandler([emitter, , , modules, client]: DependencyList) {
    const interactionStream$ = sharedEventStream<Interaction>(client, 'interactionCreate');
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
