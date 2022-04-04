import {  first, from, fromEvent } from 'rxjs';
import { basename } from 'path';
import * as Files from '../utilities/readFile';
import type Wrapper from '../structures/wrapper';
import type { Module } from '../structures/structxports';
import type { HandlerCallback, ModuleHandlers, ModuleStates, ModuleType } from '../structures/modules/commands/moduleHandler';
import { CommandType } from '../sern';

export const onReady = ( wrapper : Wrapper ) => {
    const { client, init, commands } = wrapper;
    fromEvent(client, 'ready')
       .pipe(first())
       .subscribe(() => {
            init?.( wrapper );
            Files.buildData( commands )
            .then( createCommandCache );
       })
};

// Refactor : ? Possibly repetitive and verbose. 
const handler = ( name : string ) =>
    ({
        [CommandType.TEXT] : mod => {
            mod.alias.forEach ( a => Files.Alias.set(a,mod));
            Files.Commands.set( name,  mod  );
        },
        [CommandType.SLASH]: mod => {
            Files.Commands.set( name ,  mod);
        },
        [CommandType.BOTH] : mod => {
            Files.Commands.set ( name, mod); 
            mod.alias.forEach (a => Files.Alias.set(a, mod));
        },
        [CommandType.MENU_USER] : mod => {
            Files.ContextMenuUser.set ( name, mod );
        },
        [CommandType.MENU_MSG] : mod =>  { 
            Files.ContextMenuMsg.set (name, mod );
        },
        [CommandType.BUTTON] : mod => {
            Files.Buttons.set(name, mod);
        },
        [CommandType.MENU_SELECT] : mod => {
            Files.SelectMenus.set(name, mod);
        }

    } as ModuleHandlers);

const registerModules = <T extends ModuleType >(name : string, mod : ModuleStates[T]) =>
    (<HandlerCallback<T>> handler(name)[mod.type])(mod);

function setCommands ( { mod, absPath } : { mod : Module, absPath : string } ) {
   const name = mod.name ?? Files.fmtFileName(basename(absPath));
   registerModules(name, mod); 
}

function createCommandCache( 
    arr: {mod: Module, absPath: string}[] 
  ) {
    from(arr).subscribe ( setCommands );
}
