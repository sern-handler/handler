
import type { Interaction } from 'discord.js';
import { fromEvent,  Observable, of,  concatMap, map, tap } from 'rxjs';
import { CommandType } from '../sern';
import Context from '../structures/context';
import type Wrapper from '../structures/wrapper';
import * as Files from '../utilities/readFile';




export const onInteractionCreate = ( wrapper : Wrapper ) => {
      const { client } = wrapper;  

      const interactionEvent = (<Observable<Interaction>> fromEvent(client, 'interactionCreate'))

      interactionEvent.pipe(
          concatMap ( async interaction => {
            if(interaction.isCommand()) {
                return of(
                    Files.ApplicationCommandStore[interaction.commandType]
                    .get(interaction.commandName)).pipe(

                    )
            }

          })
      ).subscribe()
/**       concatMap (async interaction => {
            if (interaction.isChatInputCommand()) {
                return of(Files.Commands.get(interaction.commandName))
                .pipe(
                    filterTap(CommandType.Slash, (mod) => {
                        const ctx = Context.wrap(interaction);
                        mod.execute(ctx, ['slash', interaction.options]);
                    }),
                 );
            }
            if (interaction.isContextMenuCommand()) {
                return of(Files.ContextMenuUser.get(interaction.commandName))
                .pipe(
                    filterTap(CommandType.MenuUser, (mod) => { 
                        mod.execute(interaction);
                    }),
                );
            }
            if (interaction.isMessageContextMenuCommand()) {
                return of(Files.ContextMenuMsg.get(interaction.commandName))
                .pipe(
                    filterTap(CommandType.MenuMsg, (mod, plugs) => {
                        mod.execute(interaction);
                    }),
                );
            }
            if (interaction.isButton()) {
                return of(Files.Buttons.get(interaction.customId))
                .pipe(
                    filterTap(CommandType.Button, (mod, plugs) => {
                        mod.execute(interaction);
                    })
                );
            }
            if (interaction.isSelectMenu()) {
                return of(Files.SelectMenus.get(interaction.customId))
                .pipe(
                    filterTap(CommandType.MenuSelect, (mod, plugs) => {
                        mod.execute(interaction);
                    })
                );
            }
            else return of();

        })
      ).subscribe({
       error(e){
        throw e;
       },
       next(_command) {
        //every command that gets triggered ends up here
        //console.log(command);
       },
   });
   **/
};

