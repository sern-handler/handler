
import { ApplicationCommandType, Interaction } from 'discord.js';
import { fromEvent,  Observable, of,  concatMap, map, filter } from 'rxjs';
import { CommandType } from '../sern';
import Context from '../structures/context';
import type { ModuleDefs } from '../structures/modules/commands/moduleHandler';
import type { PluggedModule } from '../structures/modules/module';
import type Wrapper from '../structures/wrapper';
import * as Files from '../utilities/readFile';
import { match, partition } from './observableHandling';
import { isEventPlugin } from './readyEvent';




export const onInteractionCreate = ( wrapper : Wrapper ) => {
      const { client } = wrapper;  

      const interactionEvent$ = (<Observable<Interaction>> fromEvent(client, 'interactionCreate'))
      

      const processCommand$ = interactionEvent$.pipe(
        concatMap( interaction => {
            if(interaction.isCommand()) {
                return of( Files
                .ApplicationCommandStore[interaction.commandType]
                .get(interaction.commandName)
                ).pipe( 
                )
                
            }
        })
      );

                       

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

