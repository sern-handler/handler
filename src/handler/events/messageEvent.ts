import type { Message } from "discord.js";
import { filter, fromEvent, Observable } from "rxjs";
import type Wrapper from "../structures/wrapper";
import { isNotFromBot } from "../utilities/messageHelpers";

export const onMessageCreate = ( wrapper : Wrapper) => {
    const { client } = wrapper;
    (fromEvent( client, 'messageCreate') as Observable<Message>)
    .pipe ( 
        filter( isNotFromBot ),

    ).subscribe() 


}
