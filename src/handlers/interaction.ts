import type { Module } from '../types/core-modules'
import {  callPlugins } from './event-utils';
import { SernError } from '../core/structures/enums'
import { createSDT, isAutocomplete, isCommand, isMessageComponent, isModal, treeSearch } from '../core/functions'
import { UnpackedDependencies } from '../types/utility';
import * as Id from '../core/id'
import { Context } from '../core/structures/context';



export function interactionHandler(deps: UnpackedDependencies, defaultPrefix?: string) {
    //i wish javascript had clojure destructuring 
    const { '@sern/client': client,
            '@sern/modules': moduleManager,
            '@sern/emitter': emitter } = deps

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
            throw Error(result.error ?? SernError.PluginFailure)
        }
        if(payload.args.length != 2) {
            throw Error ('assdfasd')
        }
        //@ts-ignore assigning final state from plugin
        payload.args[1].state = result.value
        

        // will be blocking if long task + await 
        // todo, add to task queue
        module.execute(...payload.args)
    });
}
