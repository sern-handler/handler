import type { Message } from "discord.js";
import { map, filter, fromEvent,  Observable, of, concatMap  } from "rxjs";
import { None, Some } from "ts-results";
import Context from "../structures/context";
import type Wrapper from "../structures/wrapper";
import { isNotFromDM, isNotFromBot, hasPrefix, fmt } from "../utilities/messageHelpers";
import * as Files from '../utilities/readFile';

export const onMessageCreate = ( wrapper : Wrapper) => {
    const { client, defaultPrefix } = wrapper;
    (fromEvent( client, 'messageCreate') as Observable<Message>)
    .pipe ( 
        filter( isNotFromBot ),
        filter( isNotFromDM ),
        filter( m => hasPrefix(m, defaultPrefix)),
        concatMap ( m => of(fmt(m, defaultPrefix))
           .pipe (
            map(([prefix, ...args ]) =>{
                return [Files.Commands.get(prefix) ?? Files.Alias.get(prefix), new Context(Some(m), None), args ] as const;
            }),
            filter( ([mod]) => mod !== undefined),
            map ( ([mod, ctx, args ]) => {
                 const parsedArgs = mod!.parse?.(ctx, args);
                 return mod!.execute(ctx, parsedArgs);
             })
           )
        )
        
    ).subscribe() 


}
