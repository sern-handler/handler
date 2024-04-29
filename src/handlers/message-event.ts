import { mergeMap, EMPTY, concatMap } from 'rxjs';
import type { Message } from 'discord.js';
import { PayloadType } from '../core';
import { sharedEventStream, SernError, filterTap, resultPayload } from '../core/_internal';
import { createMessageHandler, executeModule, makeModuleExecutor } from './event-utils';
import type { DependencyList } from '../types/ioc';

/**
 * Ignores messages from any person / bot except itself
 * @param prefix
 */
function isNonBot(prefix: string) {
    return (msg: Message): msg is Message => !msg.author.bot && hasPrefix(prefix, msg.content);
}

function hasPrefix(prefix: string, content: string) {
    const prefixInContent = content.slice(0, prefix.length);
    return (
        prefixInContent.localeCompare(prefix, undefined, {
            sensitivity: 'accent',
        }) === 0
    );
}

export function messageHandler(
    [emitter, err, log, modules, client]: DependencyList,
    defaultPrefix: string | undefined,
) {
    if (!defaultPrefix) {
        log?.debug({
            message: 'No prefix found. message handler shutting down',
        });
        return EMPTY;
    }
    const messageStream$ = sharedEventStream<Message>(client, 'messageCreate');
    const handle = createMessageHandler(messageStream$, defaultPrefix, modules);

    const msgCommands$ = handle(isNonBot(defaultPrefix));

    return msgCommands$.pipe(
        filterTap((e) => emitter.emit('warning', resultPayload(PayloadType.Warning, undefined, e))),
        concatMap(makeModuleExecutor(module => {
            const result = resultPayload(PayloadType.Failure, module, SernError.PluginFailure);
            emitter.emit('module.activate', result);
        })),
        mergeMap(payload => executeModule(emitter, log, err, payload)));
}
