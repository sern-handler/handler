import {  concatMap, first, from, fromEvent, map, tap } from 'rxjs';
import { basename } from 'path';
import * as Files from '../utilities/readFile';
import type Wrapper from '../structures/wrapper';
import type { HandlerCallback, ModuleHandlers, ModuleStates, ModuleType } from '../structures/modules/commands/moduleHandler';
import { CommandType } from '../sern';
import type { PluggedModule } from '../structures/modules/module';
import type { CommandPlugin, SernPlugin } from '../plugins/plugin';
import { partition } from './observableHandling';
import type { Client } from 'discord.js';
import { Err, Ok } from 'ts-results';

export const onReady = ( wrapper : Wrapper ) => {
    const { client, commands } = wrapper;
    fromEvent(client, 'ready')
       .pipe(
        take(1),
        concatMap ( _ => {
          


        })
       )
       .subscribe(() => {
            Files.buildData( commands )
            .then( deployCommands(client) );
       })
};

// Refactor : ? Possibly repetitive and verbose. 
const handler = ( name : string ) =>
    ({
        [CommandType.Text] : mod => {
            mod.alias.forEach ( a => Files.Alias.set(a,mod));
            Files.Commands.set( name,  mod  );
        },
        [CommandType.Slash]: mod => {
            Files.Commands.set( name ,  mod);
        },
        [CommandType.Both] : mod => {
            Files.Commands.set ( name, mod); 
            mod.alias.forEach (a => Files.Alias.set(a, mod));
        },
        [CommandType.MenuUser] : mod => {
            Files.ContextMenuUser.set ( name, mod );
        },
        [CommandType.MenuMsg] : mod =>  { 
            Files.ContextMenuMsg.set (name, mod );
        },
        [CommandType.Button] : mod => {
            Files.Buttons.set(name, mod);
        },
        [CommandType.MenuSelect] : mod => {
            Files.SelectMenus.set(name, mod);
        },
    } as ModuleHandlers);

const registerModules = <T extends ModuleType >(name : string, mod : ModuleStates[T]) =>
    (<HandlerCallback<T>> handler(name)[mod.type])(mod);

function setCommands (  plugged : PluggedModule  ) {
    registerModules(plugged.mod.name!, plugged.mod); 
}

function deployCommands (wrapper : Client) {

    return function (arr : { plugged : PluggedModule, absPath : string}[]) {
        from(arr)
            .pipe(
                map (({plugged, absPath}) => {
                    const name = plugged.mod.name ?? Files.fmtFileName(basename(absPath));
                    if (plugged.mod.name === undefined ) {
                        return { mod: { name, ...plugged.mod }, plugins : plugged.plugins };
                    }
                    return plugged;
                }),
                concatMap( ({ plugins, mod} ) => {
                    const [ cmdPlugins, eventPlugins ] = partition(plugins, isCmdPlugin);

                    return from(cmdPlugins)
                    .pipe(
                        

                    )
                }),
                tap (plug => deployPlugins(plug, wrapper)),
                tap ( setCommands ),
            ).subscribe ( );
    }
}

function isCmdPlugin ( p : SernPlugin) : p is CommandPlugin { 
    return (p.type & 0) !== 0;
}

// 0b0
// 0b0
function deployPlugins(plugged: PluggedModule, client : Client) {
        const { plugins, mod } = plugged;
        const [ cmdPlugins, eventPlugins ] = partition(plugins, isCmdPlugin) 
        
}
