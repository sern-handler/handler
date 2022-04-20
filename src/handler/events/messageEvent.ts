import type { Message } from 'discord.js';
import { fromEvent,  Observable, of, concatMap, mergeMap, map, from, every, concatAll, concat } from 'rxjs';
import { Err, Ok } from 'ts-results';
import type { Args } from '../..';
import type { EventPlugin } from '../plugins/plugin';
import { CommandType } from '../sern';
import Context from '../structures/context';
import type Wrapper from '../structures/wrapper';
import { fmt } from '../utilities/messageHelpers';
import * as Files from '../utilities/readFile';
import { filterCorrectModule, ignoreNonBot } from './observableHandling';

export const onMessageCreate = (wrapper : Wrapper) => {
    const { client, defaultPrefix } = wrapper;
    if (!defaultPrefix) return;
    const messageEvent$ = (<Observable<Message>> fromEvent( client, 'messageCreate'));
    const processMessage$ = messageEvent$.pipe(
        ignoreNonBot(defaultPrefix),
        map(message => {
            const [prefix, ...rest] = fmt(message, defaultPrefix);
            return {
                ctx : Context.wrap(message),
                args : <Args>['text', rest],
                mod : Files.Commands.get(prefix) ?? Files.Alias.get(prefix)
            }
        }));
    const ensureModuleType$ = processMessage$.pipe(
            concatMap(payload => of(payload.mod)
            .pipe(
                filterCorrectModule(CommandType.Text),
                map( textCommand => ({ ...payload, textCommand }))
            )));
    const processPlugins$ = ensureModuleType$.pipe(
            mergeMap( ({ctx, args, textCommand}) => {
               const res = from(textCommand.plugins.map(ePlug => {
                    return from((<EventPlugin>ePlug).execute([ctx, args], {
                            next : () => Ok.EMPTY,
                            stop : () => Err.EMPTY
                    }))
               }));
               return res.pipe(concatAll(), every(res => res.ok))
            })
        );

};
