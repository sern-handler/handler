import { concatMap, first, from, fromEvent, map, pipe, tap } from "rxjs";
import { basename } from 'path';
import * as Files from '../utilities/readFile';
import type Wrapper from '../structures/wrapper';
import type { Command } from "../structures/commands/command";
import type { ApplicationCommandOptionData } from "discord.js";
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

function setCommands ( { mod, absPath } : { mod : Command, absPath : string } ) {
   const options = mod.options ?? [] as ApplicationCommandOptionData[];
   const name = mod.name ?? Files.fmtFileName(basename(absPath));

   mod.alias?.forEach( n =>  Files.Alias.set( n, { mod, options } )); 

   Files.Commands.set(name, { mod, options });
}

async function createCommandCache( 
    arr: Promise<{mod: Command, absPath: string}[]> 
    ) {
    from(await arr).subscribe ( setCommands );
}
