import { mergeMap, EMPTY } from 'rxjs';
import type { Message } from 'discord.js';
import { SernEmitter } from '../core';
import { sharedEventStream, SernError, filterTap } from '../core/_internal';
import { createMessageHandler, executeModule, makeModuleExecutor } from './_internal';
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
    [emitter, , log, modules, client]: DependencyList,
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
        filterTap((e) => emitter.emit('warning', SernEmitter.warning(e))),
        makeModuleExecutor(module => {
            emitter.emit('module.activate', SernEmitter.failure(module, SernError.PluginFailure));
        }),
        mergeMap(payload => executeModule(emitter, payload)),
    );
}
