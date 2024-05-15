import { EMPTY, mergeMap, concatMap } from 'rxjs';
import type { Message } from 'discord.js';
import { createMessageHandler, executeModule, makeModuleExecutor } from './event-utils';
import { PayloadType, SernError } from '../core/structures/enums'
import { resultPayload } from '../core/functions'
import {  filterTap, sharedEventStream } from '../core/operators'
import { UnpackedDependencies } from '../types/utility';

/**
 * Ignores messages from any person / bot except itself
 * @param prefix
 */
function isNonBot(prefix: string) {
    return (msg: Message): msg is Message => !msg.author.bot && hasPrefix(prefix, msg.content);
}

function hasPrefix(prefix: string, content: string) {
    const prefixInContent = content.slice(0, prefix.length);
    return (prefixInContent.localeCompare(prefix, undefined, { sensitivity: 'accent' }) === 0);
}

export function messageHandler({"@sern/emitter": emitter, '@sern/errors':err, 
     '@sern/logger': log, '@sern/client': client,
     '@sern/modules': commands}: UnpackedDependencies,
    defaultPrefix: string | undefined) {
    if (!defaultPrefix) {
        log?.debug({ message: 'No prefix found. message handler shutting down' });
        return EMPTY;
    }
    const messageStream$ = sharedEventStream<Message>(client, 'messageCreate');
    const handle = createMessageHandler(messageStream$, defaultPrefix, commands);

    const msgCommands$ = handle(isNonBot(defaultPrefix));

    return msgCommands$.pipe(
        filterTap((e) => emitter.emit('warning', resultPayload(PayloadType.Warning, undefined, e))),
        concatMap(makeModuleExecutor(module => {
            const result = resultPayload(PayloadType.Failure, module, SernError.PluginFailure);
            emitter.emit('module.activate', result);
        })),
        mergeMap(payload => executeModule(emitter, log, err, payload)));
}
