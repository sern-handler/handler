import type { Message } from "discord.js";
import { filter, fromEvent, map, Observable } from "rxjs";
import type Wrapper from "../structures/wrapper";
import { isNotFromDM, isNotFromBot, hasPrefix } from "../utilities/messageHelpers";

export const onMessageCreate = ( wrapper : Wrapper) => {
    const { client, defaultPrefix } = wrapper;
    (fromEvent( client, 'messageCreate') as Observable<Message>)
    .pipe ( 
        filter( isNotFromBot ),
        filter( isNotFromDM ),
        filter(m => hasPrefix(m, defaultPrefix)),
        
    ).subscribe(console.log) 


}
