import {  first, from, fromEvent } from 'rxjs';
import { basename } from 'path';
import * as Files from '../utilities/readFile';
import type Wrapper from '../structures/wrapper';
import type { Module } from '../structures/structxports';
import type { HandlerCallback, ModuleHandlers, ModuleStates, ModuleType } from '../structures/modules/commands/moduleHandler';
import { CommandType } from '../sern';
import type { PluggedModule } from '../structures/modules/module';

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


function setCommands ( { plugged, absPath } : { plugged: PluggedModule, absPath : string } ) {
   const name = plugged.mod.name ?? Files.fmtFileName(basename(absPath));
   // making all modules have name property
   if (plugged.mod.name === undefined ) {
    registerModules(name, { name, ...plugged.mod });
   } else {
    registerModules(name, plugged.mod); 
   }
}

function createCommandCache( 
    arr: {plugged: PluggedModule, absPath: string}[] 
  ) {
      // possible mem leak?
    from(arr).subscribe ( setCommands );
}


