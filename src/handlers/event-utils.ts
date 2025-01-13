import type { Emitter, Logging } from '../core/interfaces';
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

export function executeModule(emitter: Emitter, logger: Logging|undefined, { module, args } : ExecutePayload) {
    
    const moduleCalled = wrapAsync(async () => {
        return module.execute(...args);
    })
    moduleCalled 
        .then((res) => {
            if(res.ok) {
                emitter.emit('module.activate', resultPayload('success', module))    
            } else {
                if(!emitter.emit('error', resultPayload('failure', module, res.error))) {
                    // node crashes here.
                    logger?.error({ 'message': res.error })
                }
            }
        })
        .catch(err => { 
            throw err 
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
