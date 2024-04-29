import { Interaction } from 'discord.js';
import { mergeMap, merge, concatMap } from 'rxjs';
import { PayloadType } from '../core/structures/enums';
import {
    isAutocomplete,
    isCommand,
    isMessageComponent,
    isModal,
    sharedEventStream,
    SernError,
    filterTap,
    resultPayload,
} from '../core/_internal';
import { createInteractionHandler, executeModule, makeModuleExecutor } from './event-utils';
import type { DependencyList } from '../types/ioc';

export function interactionHandler([emitter, err, log, modules, client]: DependencyList) {
    const interactionStream$ = sharedEventStream<Interaction>(client, 'interactionCreate');
    const handle = createInteractionHandler(interactionStream$, modules);

    const interactionHandler$ = merge(
        handle(isMessageComponent),
        handle(isAutocomplete),
        handle(isCommand),
        handle(isModal),
    );
    return interactionHandler$
        .pipe(
            filterTap(e => emitter.emit('warning', resultPayload(PayloadType.Warning, undefined, e))),
            concatMap(makeModuleExecutor(module => 
                emitter.emit('module.activate', resultPayload(PayloadType.Failure, module, SernError.PluginFailure)))),
            mergeMap(payload => executeModule(emitter, log, err, payload)));
}
