import { EMPTY, mergeMap, concatMap } from 'rxjs';
import type { Message } from 'discord.js';
import { createMessageHandler, executeModule, intoTask } from './event-utils';
import { PayloadType, SernError } from '../core/structures/enums'
import { resultPayload } from '../core/functions'
import {  filterTap, sharedEventStream } from '../core/operators'
import { UnpackedDependencies } from '../types/utility';
import type { Emitter } from '../core/interfaces';

/**
 * Ignores messages from any person / bot except itself
 * @param prefix
 */
function isNonBot(prefix: string) {
    return (msg: Message): msg is Message => !msg.author.bot && hasPrefix(prefix, msg.content);
}

function hasPrefix(prefix: string, content: string) {
    const prefixInContent = content.slice(0, prefix.length);
    return prefixInContent.localeCompare(prefix, undefined, { sensitivity: 'accent' }) === 0;
}

export default 
function (deps: UnpackedDependencies, defaultPrefix?: string) {
    const {"@sern/emitter": emitter,  
           '@sern/logger': log, 
           '@sern/client': client} = deps

    if (!defaultPrefix) {
        log?.debug({ message: 'No prefix found. message handler shutting down' });
        return EMPTY;
    }
    const messageStream$ = sharedEventStream<Message>(client as unknown as Emitter, 'messageCreate');
    const handle = createMessageHandler(messageStream$, defaultPrefix, deps);

    const msgCommands$ = handle(isNonBot(defaultPrefix));

    return msgCommands$.pipe(
        filterTap(e => emitter.emit('warning', resultPayload(PayloadType.Warning, undefined, e))),
        concatMap(intoTask(module => {
            const result = resultPayload('failure', module, SernError.PluginFailure);
            emitter.emit('module.activate', result);
        })),
        mergeMap(payload => {
            if(payload)
                return executeModule(emitter, payload)
            return EMPTY;
        }));
}
