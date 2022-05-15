import type {
    ChatInputCommandInteraction,
    CommandInteraction,
    Interaction,
    MessageContextMenuCommandInteraction as MessageCtxInt,
    UserContextMenuCommandInteraction as UserCtxInt,
} from 'discord.js';
import { concatMap, fromEvent, Observable, of, throwError, map } from 'rxjs';
import type Wrapper from '../structures/wrapper';
import * as Files from '../utilities/readFile';
import { isEventPlugin } from './readyEvent';
import { match, P } from 'ts-pattern';
import { SernError } from '../structures/errors';
import Context from '../structures/context';
import type { Result } from 'ts-results';
import type { PluggedModule } from '../structures/modules/module';
import { CommandType, controller } from '../sern';
import type { Args } from '../../types/handler';
import type { MessageComponentInteraction } from 'discord.js';
import { ComponentType } from 'discord.js';
import type { UnionToTuple } from '../utilities/resolveParameters';

function isChatInputCommand(i : CommandInteraction) : i is ChatInputCommandInteraction {
    return i.isChatInputCommand();
}
function applicationCommandHandler(plugged: PluggedModule | undefined, interaction: CommandInteraction) {
    if (plugged === undefined) {
        return throwError(() => SernError.UndefinedModule);
    }
    const eventPlugins = plugged.plugins.filter(isEventPlugin);
    return match(interaction)
        .when(isChatInputCommand, i => {
                const ctx = Context.wrap(i);
                const res = eventPlugins.map(e => {
                    return e.execute(
                       [ctx, <Args>['slash', i.options]]
                        , controller);
                }) as Awaited<Result<void, void>>[];
                //Possible unsafe cast
                // could result in the promises not being resolved
                return of({ type : plugged.mod.type, res, plugged, ctx });
            },
        )
        .when(
            () => P._,
            (ctx : UserCtxInt | MessageCtxInt) => {
                //Kinda hackish
                const res = eventPlugins.map(e => {
                    return e.execute(
                            [ctx] as UnionToTuple<CommandType.MenuMsg | CommandType.MenuUser>
                        , controller);
                }) as Awaited<Result<void, void>>[];
                return of({ type : plugged.mod.type,  res,  plugged, ctx });
            },
        )
        .run();
}

function messageComponentInteractionHandler(
    plugged: PluggedModule | undefined,
    interaction: MessageComponentInteraction,
) {
    if (plugged === undefined) {
        return throwError(() => SernError.UndefinedModule);
    }
    const eventPlugins = plugged.plugins.filter(isEventPlugin);
    return match(interaction)
        .with({
                componentType : P.union(ComponentType.Button, ComponentType.SelectMenu)
            },(ctx ) => {
            const res = eventPlugins.map(e => {
                return e.execute([ctx] as UnionToTuple<CommandType.Button | CommandType.MenuSelect>, controller);
            }) as Awaited<Result<void, void>>[];
            return of({ type : plugged.mod.type, res,  plugged, ctx });
        })
        .otherwise(_ => throwError( () => SernError.NotSupportedInteraction) );
}

export const onInteractionCreate = (wrapper: Wrapper) => {
    const { client } = wrapper;

    const interactionEvent$ = <Observable<Interaction>>fromEvent(client, 'interactionCreate');

    interactionEvent$
        .pipe(
            /*processing plugins*/
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
                else return throwError(() => SernError.NotSupportedInteraction);
            }),
        )
        .subscribe(modul => {

        });


};
