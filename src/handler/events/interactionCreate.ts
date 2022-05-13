import type {
    ChatInputCommandInteraction,
    CommandInteraction,
    Interaction,
    MessageContextMenuCommandInteraction as MessageCtxInt,
    UserContextMenuCommandInteraction as UserCtxInt,
} from 'discord.js';
import { concatMap, fromEvent, Observable, of, throwError } from 'rxjs';
import type Wrapper from '../structures/wrapper';
import * as Files from '../utilities/readFile';
import { isEventPlugin } from './readyEvent';
import { match, P } from 'ts-pattern';
import { SernError } from '../structures/errors';
import Context from '../structures/context';
import type { Result } from 'ts-results';
import type { PluggedModule } from '../structures/modules/module';
import { CommandType, controller } from '../sern';
import type { EventPlugin } from '../plugins/plugin';

function applicationCommandHandler<
    T extends CommandType.Both | CommandType.MenuUser | CommandType.MenuMsg | CommandType.Slash,
>(mod: PluggedModule | undefined, interaction: CommandInteraction) {
    if (mod === undefined) {
        return throwError(() => SernError.UndefinedModule);
    }
    const eventPlugins = mod.plugins.filter(isEventPlugin);
    return match(interaction)
        .when(
            i => i.isChatInputCommand(),
            (i: ChatInputCommandInteraction) => {
                const ctx = Context.wrap(i);
                const res = eventPlugins.map((e: EventPlugin) => {
                    if (![CommandType.Slash, CommandType.Both].includes(e.modType)) {
                        return throwError(() => SernError.NonValidModuleType);
                    }
                    return e.execute([ctx, ['slash', i.options]], controller);
                }) as Awaited<Result<void, void>>[];
                //Possible unsafe cast
                // could result in the promises not being resolved
                return of({ res, mod, ctx });
            },
        )
        .when(
            () => P._,
            (i: MessageCtxInt | UserCtxInt) => {
                // const res = eventPlugins.map(e => {
                //
                //
                // });
                return of({});
            },
        )
        .run();
}

export const onInteractionCreate = (wrapper: Wrapper) => {
    const { client } = wrapper;

    const interactionEvent$ = <Observable<Interaction>>fromEvent(client, 'interactionCreate');

    interactionEvent$
        .pipe(
            concatMap(interaction => {
                if (interaction.isCommand()) {
                    const modul =
                        Files.ApplicationCommandStore[interaction.commandType].get(interaction.commandName) ??
                        Files.BothCommand.get(interaction.commandName);
                    return applicationCommandHandler(modul, interaction);
                }
                return of({});
            }),
        )
        .subscribe(console.log);

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
