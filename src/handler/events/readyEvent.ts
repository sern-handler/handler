import { concatMap, first, from, fromEvent, map, pipe, tap } from "rxjs";
import { basename } from 'path';
import * as Files from '../utilities/readFile';
import type Wrapper from '../structures/wrapper';
import type { Modules } from "../structures/structxports";
import type { HandlerCallback, ModuleDefs, ModuleHandlers, ModuleStates, ModuleType } from "../structures/commands/moduleHandler";
import { CommandType } from "../sern";

export const onReady = ( wrapper : Wrapper ) => {
    const { client, init, commands, } = wrapper;
    fromEvent(client, 'ready')
       .pipe(
           first(),
           tap(() => init?.( wrapper ) ),
           concatMap( 
                pipe( 
                  () => Files.buildData(commands),
                  ( createCommandCache )
                )
            ),  
        )
       .subscribe( () => console.log(Files.Commands));
}

const handler = ( name : string ) =>
    ({
        [CommandType.TEXT] : mod => {
            mod.alias.forEach ( a => Files.Alias.set(a,mod));
            Files.Commands.set( name,  mod  );
        },
        [CommandType.SLASH]: mod => {
            Files.Commands.set( name,  mod);
        },
        [CommandType.BOTH] : mod => {
            Files.Commands.set ( name, mod); 
            mod.alias.forEach (a => Files.Alias.set(a, mod));
        }
    }) as ModuleHandlers;

const registerModules = <T extends ModuleType >(name : string, mod : ModuleStates[T]) =>
    (handler(name)[mod.type] as HandlerCallback<T>)(mod);

function setCommands ( { mod, absPath } : { mod : Modules.Module, absPath : string } ) {
   const name = mod.name ?? Files.fmtFileName(basename(absPath));
   registerModules(name, mod); 
}

async function createCommandCache( 
    arr: Promise<{mod: Modules.Module, absPath: string}[]> 
    ) {
    console.log(await arr);
    from(await arr).subscribe ( setCommands );
}
