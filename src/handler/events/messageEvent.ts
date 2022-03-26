import type { Message } from 'discord.js';
import { map, filter, fromEvent,  Observable, of, concatMap, tap } from 'rxjs';
import { None, Some } from 'ts-results';
import { CommandType } from '../sern';
import type { TextCommand } from '../structures/commands/module';
import Context from '../structures/context';
import type Wrapper from '../structures/wrapper';
import { isNotFromDM, isNotFromBot, hasPrefix, fmt } from '../utilities/messageHelpers';
import * as Files from '../utilities/readFile';

export const onMessageCreate = (wrapper : Wrapper) => {
    const { client, defaultPrefix } = wrapper;
    (fromEvent( client, 'messageCreate') as Observable<Message>)
    .pipe ( 
        filter( isNotFromBot ),
        filter( isNotFromDM ),
        filter( m => hasPrefix(m, defaultPrefix)),
        concatMap ( m => of( fmt(m, defaultPrefix) )
           .pipe (
            map(([prefix, ...args ]) => 
                [
                    Files.Commands.get(prefix) ?? Files.Alias.get(prefix),
                    new Context(Some(m), None), 
                    args 
                ] as const
            ),
            filter( ([mod]) => mod !== undefined && (mod.type & CommandType.TEXT) != 0 ),
            tap ( ([ mod, ctx, args ]) => {
                (mod as TextCommand)!.execute(ctx, ['text', args]);
             }),
           )
        )
        
    ).subscribe ({
       error() {
        //log things
        console.log('Failed to finished message subscription!');
       },
       next(command) {
        //log on each command emitted 
        console.log(command);
       },
    }); 


};
