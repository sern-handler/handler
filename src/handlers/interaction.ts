import type { Module } from '../types/core-modules'
import {  callPlugins, executeModule } from './event-utils';
import { SernError } from '../core/structures/enums'
import { createSDT, isAutocomplete, isCommand, isMessageComponent, isModal, resultPayload, treeSearch } from '../core/functions'
import { UnpackedDependencies } from '../types/utility';
import * as Id from '../core/id'
import { Context } from '../core/structures/context';



export function interactionHandler(deps: UnpackedDependencies, defaultPrefix?: string) {
    //i wish javascript had clojure destructuring 
    const { '@sern/client': client,
            '@sern/modules': moduleManager,
            '@sern/emitter': reporter } = deps

    client.on('interactionCreate', async (event) => {

        //returns array of possible ids
        const possibleIds = Id.reconstruct(event);

        let modules = possibleIds
            .map(({ id, params }) => ({ module: moduleManager.get(id)!, params }))
            .filter(({ module }) => module !== undefined);

        if(modules.length == 0) {
            return;
        }
        const { module, params } = modules.at(0)!;
        let payload;
        if(isAutocomplete(event)) {
            //@ts-ignore stfu
            const option = treeSearch(event, module.options);
            //@ts-ignore stfu
            const { command } = option;
            payload= { module: command as Module, //autocomplete is not a true "module" warning cast!
                       args: [event, createSDT(command, deps, params)] };
        } else if(isCommand(event)) {
            payload={ module, 
                      args: [Context.wrap(event, defaultPrefix), createSDT(module, deps, params)] };
        } else if (isModal(event) || isMessageComponent(event)) {
            payload={ module, args: [event, createSDT(module, deps, params)] }
        } else {
            throw Error("Invalid event")
        }
        const result = await callPlugins(payload)
        if(!result.ok) {
            reporter.emit('module.activate', resultPayload('failure', module, result.error ?? SernError.PluginFailure))
            return
        }
        if(payload.args.length != 2) {
            throw Error ('Invalid payload')
        }
        //@ts-ignore assigning final state from plugin
        payload.args[1].state = result.value

        // will be blocking if long task + await 
        // todo, add to task queue
        
        executeModule(reporter, { module, args: payload.args });
    });
}
