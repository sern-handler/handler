/*
 * ---------------------------------------------------------------------
 *  Copyright (C) 2022 Sern
 *  This software is licensed under the MIT License.
 *  See LICENSE.md in the project root for license information.
 * ---------------------------------------------------------------------
 */

import type {
    DiscordEvent,
} from '../types/handler';

import type {
    Client,
} from 'discord.js';

import type Wrapper from './structures/wrapper';
import { fromEvent } from 'rxjs';
import { SernError } from './structures/errors';
import { onReady } from './events/readyEvent';
import { onMessageCreate } from './events/messageEvent';
import { onInteractionCreate } from './events/interactionCreate';

export function init( wrapper : Wrapper ) {
   const { events, client } = wrapper; 
   if (events !== undefined) eventObserver(client, events);
   onReady( wrapper );
   onMessageCreate( wrapper );
   onInteractionCreate ( wrapper ); 
}

function eventObserver(client: Client, events: DiscordEvent[] ) {
  events.forEach( ( [event, cb] ) => {
      if (event === 'ready') throw Error(SernError.RESERVED_EVENT);
      fromEvent(client, event, cb).subscribe();
  });
}


/**
 * @enum { number };
 */
export enum CommandType {
    TEXT  =      0b000001,
    SLASH =      0b000010,
    MENU_USER =  0b000100,
    MENU_MSG =   0b001000,
    BUTTON =     0b010000,
    MENU_SELECT= 0b100000,
    BOTH  =      0b000011,
    ANY   =      0b111111
}

