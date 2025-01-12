import type { Emitter } from '../core/interfaces';
import { SernError } from '../core/structures/enums'
import { Ok, wrapAsync} from '../core/structures/result';
import type {  Module } from '../types/core-modules';
import { inspect } from 'node:util'
import { resultPayload } from '../core/functions'
import merge from 'deepmerge'


interface ExecutePayload {
    module: Module;
    args: unknown[];
    [key: string]: unknown
}


function isObject(item: unknown) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

//_module is frozen, preventing from mutations
export async function callInitPlugins(_module: Module, deps: Dependencies, emit?: boolean) {
    let module = _module;
    const emitter = deps['@sern/emitter'];
    for(const plugin of module.plugins ?? []) {
        const result = await plugin.execute({ module, absPath: module.meta.absPath, deps });
        if (!result) throw Error("Plugin did not return anything. " + inspect(plugin, false, Infinity, true));
        if(!result.ok) {
            if(emit) {
                emitter?.emit('module.register',
                              resultPayload('failure', module, result.error ?? SernError.PluginFailure));
            }
            throw Error((result.error ?? SernError.PluginFailure) +
                        'on module ' + module.name + " " + module.meta.absPath);
        }
    }
    return module
}

export function executeModule(emitter: Emitter, { module, args } : ExecutePayload) {
    //do not await. this will block sern
    
    const moduleCalled = wrapAsync(async () => {
        return  module.execute(...args);
    })
    moduleCalled 
        .then(() => {
            emitter.emit('module.activate', resultPayload('success', module) )    
        })
        .catch(err => {
            emitter.emit('error', resultPayload('failure', module, err))
        })
};


export async function callPlugins({ args, module }: ExecutePayload) {
    let state = {};
    for(const plugin of module.onEvent??[]) {
        const result = await plugin.execute(...args);
        if(!result.ok) {
            return result;
        }
        if(isObject(result.value)) {
            state = merge(state, result.value!);
        }
    }
    return Ok(state);
}
