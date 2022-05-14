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
import { resolveParameters } from '../utilities/resolveParameters';
import type { Args } from '../../types/handler';
import type { MessageComponentInteraction } from 'discord.js';

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
                const res = eventPlugins.map(e => {
                    return e.execute(
                        resolveParameters<CommandType.Both>([ctx, <Args>['slash', i.options]]
                        ), controller);
                }) as Awaited<Result<void, void>>[];
                //Possible unsafe cast
                // could result in the promises not being resolved
                return of({ res, mod, ctx });
            },
        )
        .when(
            () => P._,
            (ctx : UserCtxInt | MessageCtxInt) => {
                //Kinda hackish
                const args : [UserCtxInt] | [MessageCtxInt] = ctx.isUserContextMenuCommand()
                    ? [ ctx as UserCtxInt ] : [ ctx as MessageCtxInt ];
                const res = eventPlugins.map(e => {
                    return e.execute(
                        resolveParameters<CommandType.MenuMsg | CommandType.MenuUser>(args
                        ), controller);

                });
                return of({ res, mod, ctx });
            },
        )
        .run();
}

function messageComponentInteractionHandler(
    modul: PluggedModule | undefined,
    interaction: MessageComponentInteraction,
) {
    return of(modul);
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
                if (interaction.isMessageComponent()) {
                    const modul = Files
                        .MessageCompCommandStore[interaction.componentType]
                        .get(interaction.customId);
                    return messageComponentInteractionHandler(modul, interaction);
                }
                return of({});
            }),
        )
        .subscribe(console.log);


};
