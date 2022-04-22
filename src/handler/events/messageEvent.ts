import type { Message } from 'discord.js';
import { fromEvent,  Observable, of, concatMap, mergeMap, map, from, every, concatAll, concat, tap, switchMap } from 'rxjs';
import { Err, Ok } from 'ts-results';
import type { Args } from '../..';
import { CommandType } from '../sern';
import Context from '../structures/context';
import type Wrapper from '../structures/wrapper';
import { fmt } from '../utilities/messageHelpers';
import * as Files from '../utilities/readFile';
import { filterCorrectModule, ignoreNonBot } from './observableHandling';

export const onMessageCreate = (wrapper : Wrapper) => {
    const { client, defaultPrefix } = wrapper;
    if (defaultPrefix === undefined) return;
    const messageEvent$ = (<Observable<Message>> fromEvent( client, 'messageCreate'));
    const processMessage$ = messageEvent$.pipe(
        ignoreNonBot(defaultPrefix),
        map(message => {
            const [prefix, ...rest] = fmt(message, defaultPrefix);
            console.log(prefix, rest)
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
                map( textCommand => ({ ...payload, mod : textCommand }))
            )));
    const processPlugins$ = ensureModuleType$.pipe(
            switchMap( ({ctx, args, mod}) => {
               const res = from(mod.plugins.map(ePlug => {
                    return (ePlug.execute([ctx, args], {
                            next : () => Ok.EMPTY,
                            stop : () => Err.EMPTY
                    }))
               }));
               return res.pipe(concatAll(), every(res => res.ok))
            })
        );
    ensureModuleType$.pipe(
        concatMap( pl => {
            return processPlugins$.pipe(
                map ( res => ({ res, pl }))
            )
        })
    ).subscribe( ({ res, pl }) => {
        console.log('test')
        console.log(res, pl)
    })
};
