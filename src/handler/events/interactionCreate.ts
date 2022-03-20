import type { CommandInteraction, Interaction } from "discord.js";
import { map, filter, fromEvent,  Observable, of, concatMap } from "rxjs";
import { None, Some } from "ts-results";
import Context from "../structures/context";
import type Wrapper from "../structures/wrapper";
import { isNotFromDM, isNotFromBot, hasPrefix, fmt } from "../utilities/messageHelpers";
import * as Files from '../utilities/readFile';

export const onInteractionCreate = ( wrapper : Wrapper ) => {
      const { client } = wrapper;  
      (fromEvent(client, 'interactionCreate') as Observable<Interaction>)
      .pipe(
        





      )







}
