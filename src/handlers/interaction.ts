import type { Interaction } from 'discord.js';
import { mergeMap, merge, concatMap, EMPTY } from 'rxjs';
import { createInteractionHandler, executeModule, intoTask, sharedEventStream, filterTap, handleCrash } from './event-utils';
import { SernError } from '../core/structures/enums'
import { isAutocomplete, isCommand, isMessageComponent, isModal, resultPayload } from '../core/functions'
import { UnpackedDependencies } from '../types/utility';

export default function interactionHandler(deps: UnpackedDependencies, defaultPrefix?: string) {
    //i wish javascript had clojure destructuring 
    const { '@sern/client': client,
            '@sern/emitter': emitter } = deps
    const interactionStream$ = sharedEventStream<Interaction>(client, 'interactionCreate');
    const handle = createInteractionHandler(interactionStream$, deps, defaultPrefix);

    const interactionHandler$ = merge(handle(isMessageComponent),
                                      handle(isAutocomplete),
                                      handle(isCommand),
                                      handle(isModal));
    return interactionHandler$
        .pipe(filterTap(e => emitter.emit('warning', resultPayload('warning', undefined, e))),
              concatMap(intoTask(module => {
                emitter.emit('module.activate', resultPayload('failure', module, SernError.PluginFailure))
              })),
              mergeMap(payload => {
                  if(payload)
                    return executeModule(emitter, payload)
                  return EMPTY;
              }),
              handleCrash(deps, "interaction handling"));
}
