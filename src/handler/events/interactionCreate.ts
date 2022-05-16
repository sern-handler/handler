import type {
    CommandInteraction,
    Interaction,
    MessageComponentInteraction,
    MessageContextMenuCommandInteraction as MessageCtxInt,
    UserContextMenuCommandInteraction as UserCtxInt,
} from 'discord.js';
import type { SelectMenuInteraction } from 'discord.js';
import { concatMap, fromEvent, Observable, of, throwError } from 'rxjs';
import type Wrapper from '../structures/wrapper';
import * as Files from '../utilities/readFile';
import { match, P } from 'ts-pattern';
import { SernError } from '../structures/errors';
import Context from '../structures/context';
import type { Result } from 'ts-results';
import { CommandType, controller } from '../sern';
import type { Args, UnionToTuple } from '../../types/handler';
import type { Module } from '../structures/module';
import type { EventPlugin } from '../plugins/plugin';
import { isButton, isChatInputCommand, isSelectMenu } from '../utilities/predicates';


function applicationCommandHandler(mod: Module | undefined, interaction: CommandInteraction) {
    if (mod === undefined) {
        return throwError(() => SernError.UndefinedModule);
    }
    const eventPlugins = mod.onEvent;
    return match(interaction)
        .when(isChatInputCommand, i => {
                const ctx = Context.wrap(i);
                const res = eventPlugins.map(e => {
                    return (<EventPlugin<CommandType.Slash>>e).execute(
                        [ctx, <Args>['slash', i.options]]
                        , controller);
                }) as Awaited<Result<void, void>>[];
                //Possible unsafe cast
                // could result in the promises not being resolved
                return of({ type: CommandType.Slash, res, mod, ctx });
            },
        )
        .when(
            () => P._,
            (ctx: UserCtxInt | MessageCtxInt) => {
                //Kinda hackish
                const res = eventPlugins.map(e => {
                    return e.execute(
                        [ctx] as UnionToTuple<CommandType.MenuMsg | CommandType.MenuUser>
                        , controller);
                }) as Awaited<Result<void, void>>[];
                return of({ type: mod.type, res, mod, ctx });
            },
        )
        .run();
}

function messageComponentInteractionHandler(
    mod: Module | undefined,
    interaction: MessageComponentInteraction,
) {
    if (mod === undefined) {
        return throwError(() => SernError.UndefinedModule);
    }
    const eventPlugins = mod.onEvent;
    return match(interaction)
        .when(isButton, ctx => {
            const res = eventPlugins.map(e => {
                return (<EventPlugin<CommandType.Button>>e).execute([ctx], controller);
            }) as Awaited<Result<void, void>>[];
            return of({ type: mod.type, res, mod, ctx });
        })
        .when(isSelectMenu, (ctx: SelectMenuInteraction) => {
            const res = eventPlugins.map(e => {
                return (<EventPlugin<CommandType.MenuSelect>>e).execute([ctx], controller);
            }) as Awaited<Result<void, void>>[];
            return of({ type: mod.type, res, mod, ctx });
        })
        .otherwise(() => throwError(() => SernError.NotSupportedInteraction));
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
                        Files.ApplicationCommands[interaction.commandType].get(interaction.commandName) ??
                        Files.BothCommands.get(interaction.commandName);
                    return applicationCommandHandler(modul, interaction);
                }
                if (interaction.isMessageComponent()) {
                    const modul = Files
                        .MessageCompCommands[interaction.componentType]
                        .get(interaction.customId);
                    return messageComponentInteractionHandler(modul, interaction);
                } else return throwError(() => SernError.NotSupportedInteraction);
            }),
        )
        .subscribe(m => {
            m;
        });


};
