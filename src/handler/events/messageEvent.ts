import type { Message } from 'discord.js';
import { fromEvent,  Observable, of, concatMap, mergeMap } from 'rxjs';
import { Err, Ok } from 'ts-results';
import { CommandType } from '../sern';
import Context from '../structures/context';
import type Wrapper from '../structures/wrapper';
import { fmt } from '../utilities/messageHelpers';
import * as Files from '../utilities/readFile';
import { filterCorrectModule, filterTap, ignoreNonBot } from './observableHandling';

export const onMessageCreate = (wrapper : Wrapper) => {
    const { client, defaultPrefix } = wrapper;
    (<Observable<Message>> fromEvent( client, 'messageCreate'))
    .pipe( 
        ignoreNonBot(defaultPrefix),
        concatMap (async m =>  {
        const [ prefix, ...data ] = fmt(m, defaultPrefix);
        const posMod = Files.Commands.get(prefix) ?? Files.Alias.get(prefix);
        const ctx = Context.wrap(m);
        return of( posMod )
                .pipe(
                    filterCorrectModule(CommandType.Text),
                    filterTap(CommandType.Text, async (mod,plugins) => {
                        const res = await Promise.all(
                            plugins.map(async pl => ({
                                ...pl,
                                execute : await pl.execute([ctx, ['text', data] ], {
                                    next : () => Ok.EMPTY,
                                    stop : () => Err.EMPTY
                                }),
                            }))

                        );
                        if (res.every(pl => pl.execute.ok)) {
                           mod.execute(ctx, ['text', data]); 
                        }
                    })
               );
        })
    ).subscribe ({
       error(e) {
        throw e;
       },
       next(command) {
        //log on each command emitted 
        console.log(command);
       },
    }); 

};
