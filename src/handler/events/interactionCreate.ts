
import type { Interaction } from 'discord.js';
import { filter, fromEvent,  Observable, of,  tap, concatMap} from 'rxjs';
import { None, Some } from 'ts-results';
import type { SlashCommand } from '../..';
import { CommandType } from '../sern';
import type { ContextMenuMsg, ContextMenuUser } from '../structures/commands/module';
import Context from '../structures/context';
import type Wrapper from '../structures/wrapper';
import * as Files from '../utilities/readFile';
import { filterTap, is } from './interactionHandling';


export const onInteractionCreate = ( wrapper : Wrapper ) => {
      const { client } = wrapper;  

      (fromEvent(client, 'interactionCreate') as Observable<Interaction>)
      .pipe( 
        concatMap ( interaction => {
            if (interaction.isChatInputCommand()) {
                return of(Files.Commands.get(interaction.commandName))
                .pipe(
                    filterTap(CommandType.SLASH, mod => {
                        const ctx = Context.wrap(interaction);
                        mod.execute(ctx, ['slash', interaction.options]);
                    })
                 );
            }
            if (interaction.isContextMenuCommand()) {
                return of(Files.ContextMenuUser.get(interaction.commandName))
                .pipe(
                    filterTap(CommandType.MENU_USER, mod => { 
                        const ctx = Context.wrap(interaction);
                        mod.execute(ctx);
                    }),
                    
                )
            }
            if (interaction.isMessageContextMenuCommand()) {
                return of(Files.ContextMenuMsg.get(interaction.commandName))
                .pipe(
                    filterTap(CommandType.MENU_MSG, mod => {
                        const ctx = Context.wrap(interaction);
                        mod.execute(ctx);
                    }),
                )
            }
            else { return of(); }
        })
      ).subscribe({
       error(e) {
        throw e;
       },
       next(command) {
        //log on each command emitted 
        console.log(command);
       },


      });
};

