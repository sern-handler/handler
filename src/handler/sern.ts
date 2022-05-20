import type { DiscordEvent, EventEmitterRegister } from '../types/handler';

import { ApplicationCommandType, Client } from 'discord.js';

import type Wrapper from './structures/wrapper';
import { fromEvent } from 'rxjs';
import { SernError } from './structures/errors';
import { onReady } from './events/readyEvent';
import { onMessageCreate } from './events/messageEvent';
import { onInteractionCreate } from './events/interactionCreate';
import { match, P } from 'ts-pattern';
import { Err, Ok } from 'ts-results';
import { CommandType } from './structures/enums';
import { isDiscordEvent } from './utilities/predicates';

export function init(wrapper: Wrapper) {
    const { events, client } = wrapper;
    if (events !== undefined) {
        eventObserver(client, events);
    }
    onReady(wrapper);
    onMessageCreate(wrapper);
    onInteractionCreate(wrapper);
}

function eventObserver(client: Client, events: (DiscordEvent | EventEmitterRegister)[]) {
    events.forEach(event => {
        if (isDiscordEvent(event)) {
            fromEvent(client, event[0], event[1]).subscribe();
        } else {
            fromEvent(event[0], event[1], event[2]).subscribe();
        }
    });
}

export function cmdTypeToDjs(ty: CommandType) {
    return match(ty)
        .with(CommandType.Slash, () => ApplicationCommandType.ChatInput)
        .with(CommandType.MenuUser, () => ApplicationCommandType.User)
        .with(CommandType.MenuMsg, () => ApplicationCommandType.Message)
        .with(CommandType.Both, () => ApplicationCommandType.ChatInput)
        .with(P._, () => {
            throw new Error(SernError.NonValidModuleType);
        })
        .exhaustive();
}

export const controller = {
    next: () => Ok.EMPTY,
    stop: () => Err.EMPTY,
};
