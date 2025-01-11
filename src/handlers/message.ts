import type { Message } from 'discord.js';
import { callPlugins} from './event-utils';
import { SernError } from '../core/structures/enums'
import { createSDT, fmt } from '../core/functions'
import { UnpackedDependencies } from '../types/utility';
import type { Module } from '../types/core-modules';
import { Context } from '../core/structures/context';
/**
 * Ignores messages from any person / bot except itself
 * @param prefix
 */
function isBotOrNoPrefix(msg: Message, prefix: string) {
    return msg.author.bot || !hasPrefix(prefix, msg.content);
}

function hasPrefix(prefix: string, content: string) {
    const prefixInContent = content.slice(0, prefix.length);
    return prefixInContent.localeCompare(prefix, undefined, { sensitivity: 'accent' }) === 0;
}

export function messageHandler (deps: UnpackedDependencies, defaultPrefix?: string) {
    const {"@sern/emitter": emitter,  
           '@sern/logger': log, 
           '@sern/modules': mg,
           '@sern/client': client} = deps

    if (!defaultPrefix) {
        log?.debug({ message: 'No prefix found. message handler shutting down' });
        return;
    }
    client.on('messageCreate', async message => {
        if(isBotOrNoPrefix(message, defaultPrefix)) {
           return 
        }
        const [prefix] = fmt(message.content, defaultPrefix);
        let module = mg.get(`${prefix}_T`) ?? mg.get(`${prefix}_B`) as Module;
        if(!module) {
            throw Error('Possibly undefined behavior: could not find a static id to resolve')
        }
        const payload = { module, args: [Context.wrap(message, defaultPrefix), createSDT(module, deps, undefined)] }
        const result = await callPlugins(payload)
        if (!result.ok) {
//            const result = resultPayload('failure', module, SernError.PluginFailure);
//            emitter.emit('module.activate', result);
            throw Error(result.error ?? SernError.PluginFailure)
        }
        //@ts-ignore
        payload.args[1].state = result.value
        //todo, add to task queue
        module.execute(...payload.args)

    })
    
}
