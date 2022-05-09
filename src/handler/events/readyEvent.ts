import {concatMap,  from, fromEvent, map,  take,concat, skip, Observable,  of,  } from 'rxjs';
import { basename } from 'path';
import * as Files from '../utilities/readFile';
import type Wrapper from '../structures/wrapper';
import type {  HandlerCallback,   ModuleHandlers, ModuleStates, ModuleType} from '../structures/modules/commands/moduleHandler';
import { CommandType } from '../sern';
import { CommandPlugin, EventPlugin, PluginType, SernPlugin } from '../plugins/plugin';
import { correctModuleType, partition } from './observableHandling';
import { Err, Ok, Result } from 'ts-results';
import type { PluggedModule } from '../structures/modules/module';
import type { Awaitable } from 'discord.js';

export const onReady = ( wrapper : Wrapper ) => {

    const { client, commands } = wrapper;
    const ready$ = fromEvent(client, 'ready').pipe(take(1),skip(1));
    const processCommandFiles$ = Files.buildData(commands).pipe( 
             map(({plugged, absPath}) => {
                const name = plugged.mod?.name ?? Files.fmtFileName(basename(absPath));
                if (plugged.mod?.name === undefined ) {
                    return { mod: { name, ...plugged.mod }, plugins : plugged.plugins };
                }
                return plugged;
            }));
        const processPlugins$ = processCommandFiles$.pipe(
            concatMap( ({mod, plugins:allPlugins}) => {
               const [ cmdPlugins, eventPlugins ] = partition(isCmdPlugin, allPlugins);
               const cmdPluginsRes = cmdPlugins.map(plug => {
                   return {
                        ...plug,
                        name: plug?.name ?? 'Unnamed Plugin',
                        execute : plug.execute(client, mod, {
                            next : () => Ok.EMPTY,
                            stop : () => Err.EMPTY
                        })
                    };
               });
                return of({ plugged : <PluggedModule>{ mod , plugins : eventPlugins }, cmdPluginsRes }); 
            }),
        );

       
    (concat(ready$,processPlugins$) as Observable<{
        plugged: PluggedModule;
        cmdPluginsRes: {
            execute: Awaitable<Result<void, void>>;
            type: PluginType.Command;
            name: string;
            description: string;
        }[];
    }>).pipe (
        concatMap( pl => 
            from(Promise.all(pl.cmdPluginsRes.map(async e=> ({...e, execute : await e.execute }))))
                .pipe(
                    map(res => ({...pl, cmdPluginsRes : res })),
            )
    ),
)
    .subscribe(({ plugged, cmdPluginsRes }) => {
        const loadedPluginsCorrectly = cmdPluginsRes.every(res => res.execute.ok);
        const { mod, plugins } = plugged;
        if(loadedPluginsCorrectly) {
            registerModule(mod.name!, mod, plugins);
        }
        else {
            console.log(`Failed to load command ${mod.name!}`);
            console.log(mod);
        }
    }); 
    
};

function handler( name : string ) : ModuleHandlers {
    return  {
        [CommandType.Text] : (mod, plugins) => {
            mod.alias.forEach ( a => Files.TextCommandStore.aliases.set(a,{ mod, plugins}));
            Files.TextCommandStore.text.set( name,  { mod, plugins } );
        },
        [CommandType.Slash]: (mod, plugins) => {
            Files.ApplicationCommandStore[1].set( name ,  { mod, plugins });
        },
        [CommandType.Both] :( mod, plugins )=> {
            Files.BothCommand.set ( name,{ mod, plugins}); 
            mod.alias.forEach (a => Files.TextCommandStore.aliases.set(a, {mod,plugins}));
        },
        [CommandType.MenuUser] : (mod, plugins) => {
            Files.ApplicationCommandStore[2].set ( name, {mod, plugins} );
        },
        [CommandType.MenuMsg] : (mod,plugins) =>  { 
            Files.ApplicationCommandStore[3].set (name, {mod, plugins} );
        },
        [CommandType.Button] : (mod,plugins) => {
            Files.MessageCompCommandStore[2].set(name, {mod, plugins});
        },
        [CommandType.MenuSelect] : ( mod, plugins ) => {
            Files.MessageCompCommandStore[2].set(name, { mod, plugins });
        },
    };

}


function isCmdPlugin (p : SernPlugin) : p is CommandPlugin { 
    return (p.type & PluginType.Command) !== 0;
}
export function isEventPlugin( p : SernPlugin) : p is EventPlugin {
    return (p.type & PluginType.Event) !== 0;
}
function registerModule <T extends ModuleType> (
    name : string,
    mod : ModuleStates[T],
    plugins : SernPlugin[]
) {
    return (<HandlerCallback<T>> handler(name)[mod.type])(mod, plugins);
}
