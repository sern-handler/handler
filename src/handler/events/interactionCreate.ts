import type { Awaitable, ChatInputCommandInteraction, Interaction } from "discord.js";
import { map, filter, fromEvent,  Observable, of, mergeMap, tap, concatMap} from "rxjs";
import { None, Some } from "ts-results";
import { CommandType } from "../sern";
import Context from "../structures/context";
import type Wrapper from "../structures/wrapper";
import * as Files from '../utilities/readFile';



export const onInteractionCreate = ( wrapper : Wrapper ) => {
      const { client } = wrapper;  

      (fromEvent(client, 'interactionCreate') as Observable<Interaction>)
      .pipe( 
        concatMap ( interaction => {
            if (interaction.isChatInputCommand()) {
                return of(interaction.commandName).pipe(
                    map ( name => Files.Commands.get(name) ),
                    filter( mod => mod !== undefined && (mod.type & CommandType.SLASH) != 0),
                    tap ( mod => {
                        const ctx = new Context(None, Some(interaction));
                        mod!.execute(ctx, ['slash', interaction.options]); 
                    }),
                 )
            }
            if (interaction.isContextMenuCommand()) {
                return of() 

            }
            else { return of() }
        })
      ).subscribe({
       error(e) {
        throw e;
       },
       next(command) {
        //log on each command emitted 
        console.log(command);
       },


      })
}

