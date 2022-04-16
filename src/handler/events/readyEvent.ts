import {  from, fromEvent, map,  take,concat, concatAll, mergeMap, skip, Observable} from 'rxjs';
import { basename } from 'path';
import * as Files from '../utilities/readFile';
import type Wrapper from '../structures/wrapper';
import type { HandlerCallback, ModuleHandlers, ModuleStates, ModuleType } from '../structures/modules/commands/moduleHandler';
import { CommandType } from '../sern';
import type { CommandPlugin, SernPlugin } from '../plugins/plugin';
import { partition } from './observableHandling';
import { Err, Ok, Result } from 'ts-results';
import type { PluggedModule } from '../structures/modules/module';
import type { Awaitable } from 'discord.js';

export const onReady = ( wrapper : Wrapper ) => {
    const { client, commands } = wrapper;
    const ready$ = fromEvent(client, 'ready').pipe(take(1),skip(1));
    const processCommandFiles$ = from(Files.buildData(commands)).pipe( 
             concatAll(),
             map(({plugged, absPath}) => {
                const name = plugged.mod?.name ?? Files.fmtFileName(basename(absPath));
                if (plugged.mod?.name === undefined ) {
                    return { mod: { name, ...plugged.mod }, plugins : plugged.plugins };
                }
                return plugged;
             }),
             mergeMap(({ mod, plugins: allPlugins }) => {
                const [ cmdPlugins, plugins ] = partition(allPlugins, isCmdPlugin);
                return cmdPlugins.map(pl => {
                    const res = pl.execute(client, mod, {
                        next: () => Ok.EMPTY,
                        stop: () => Err.EMPTY
                    })
                    return { res, plugged : <PluggedModule>{ mod, plugins } }
                })
             }),
            );

    (concat(ready$,processCommandFiles$) as Observable<{
        res : Awaitable<Result<void, void>>, plugged : PluggedModule 
    }>).pipe(
      mergeMap(async( {res, plugged} ) => ({ res:await res, plugged }) )
    ).subscribe( 

    ({ res, plugged: { mod, plugins }}) => {
        if(res.ok) {
            registerModule(mod.name!, mod, plugins)
        } else {
            // TODO: add event emitter for command failures
            console.log('a plugin failed to load');
            console.log(`Did not register command ${mod.name!}`)
            console.log(mod);
        }
    })
}


// Refactor : ? Possibly repetitive and verbose. 
const handler = ( name : string ) =>
    ({
        [CommandType.Text] : (mod, plugins) => {
            mod.alias.forEach ( a => Files.Alias.set(a,{ mod, plugins}));
            Files.Commands.set( name,  { mod, plugins } );
        },
        [CommandType.Slash]: (mod, plugins) => {
            Files.Commands.set( name ,  { mod, plugins });
        },
        [CommandType.Both] :( mod, plugins )=> {
            Files.Commands.set ( name,{ mod, plugins}); 
            mod.alias.forEach (a => Files.Alias.set(a, {mod,plugins}));
        },
        [CommandType.MenuUser] : (mod, plugins) => {
            Files.ContextMenuUser.set ( name, {mod, plugins} );
        },
        [CommandType.MenuMsg] : (mod,plugins) =>  { 
            Files.ContextMenuMsg.set (name, {mod, plugins} );
        },
        [CommandType.Button] : (mod,plugins) => {
            Files.Buttons.set(name, {mod, plugins});
        },
        [CommandType.MenuSelect] : ( mod, plugins ) => {
            Files.SelectMenus.set(name, { mod, plugins });
        },
    } as ModuleHandlers);

function registerModule <T extends ModuleType> (
    name : string,
    mod : ModuleStates[T],
    plugins : SernPlugin[]
) {
    return (<HandlerCallback<T>> handler(name)[mod.type])(mod, plugins);
}

function isCmdPlugin ( p : SernPlugin) : p is CommandPlugin { 
    return (p.type & 0) === 0;
}


