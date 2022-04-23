import type { Message } from 'discord.js';
import { fromEvent,  Observable, of, concatMap,  map, from, every, concatAll, tap, switchMap } from 'rxjs';
import { Err, Ok } from 'ts-results';
import type { Args } from '../..';
import { CommandType } from '../sern';
import Context from '../structures/context';
import type Wrapper from '../structures/wrapper';
import { fmt } from '../utilities/messageHelpers';
import * as Files from '../utilities/readFile';
import { filterCorrectModule, ignoreNonBot } from './observableHandling';
import { isEventPlugin } from './readyEvent';

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

    const processEventPlugins$ = ensureModuleType$.pipe(
            concatMap( ({ctx, args, mod:plugged}) => {
               const eventPlugins = plugged.plugins.filter(isEventPlugin);
               const res = Promise.all(eventPlugins.map(ePlug => {
                    if((ePlug.modTy & plugged.mod.type) === 0) {
                        return Err.EMPTY;
                    }
                    return ePlug.execute([ctx, args], {
                            next : () => Ok.EMPTY,
                            stop : () => Err.EMPTY
                    });
               }));
               return from(res).pipe(map(res => ({ plugged, ctx, args, res })))
            }));
    processEventPlugins$.subscribe( ( { plugged, ctx, args, res } ) => {
        if(res.every( pl => pl.ok)) {
            Promise.resolve(plugged.mod.execute(ctx, args)).then(() =>
                console.log(plugged)
            )
        }
        else {
            console.log(plugged, "failed");
        }

    })



};
