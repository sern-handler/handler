import { EventEmitter } from 'node:events';
import * as assert from 'node:assert';
import { concatMap, from, fromEvent, map, OperatorFunction, pipe } from 'rxjs';
import { arrayifySource, callPlugin } from '../../core/operators';
import { createResultResolver } from './generic';
import { AutocompleteInteraction, BaseInteraction, Message } from 'discord.js';
import { treeSearch } from '../../core/functions';
import { SernError } from '../../core/structures/errors';
import { CommandType, Context } from '../../core';
import { isAutocomplete } from '../../core/predicates';
import { Processed } from '../types';
import { BothCommand, CommandModule, Module } from '../../core/types/modules';
import { Args } from '../../shared';

export function dispatchInteraction<
    T extends CommandModule,
    V extends BaseInteraction | Message
>(
    payload: { module: Processed<T>; event: V },
    createArgs: (m: typeof payload.event) => unknown[]
) {
    return {
        module: payload.module,
        args: createArgs(payload.event),
    };
}
//TODO: refactor dispatchers so that it implements a strategy for each different type of payload?
export function dispatchMessage(module: Processed<CommandModule>, args: [Context, Args]) {
    return {
        module,
        args
    }
}

export function dispatchAutocomplete(payload: { module: Processed<BothCommand>, event: AutocompleteInteraction }) {
    const option = treeSearch(payload.event, payload.module.options);
    if (option !== undefined) {
        return {
            module: option.command as Processed<Module>, //autocomplete is not a true "module" warning cast!
            args: [payload.event],
        };
    }
    throw Error(
        SernError.NotSupportedInteraction + ` There is no autocomplete tag for this option`,
    );

}



export function contextArgs(
    wrappable: Message | BaseInteraction,
    messageArgs?: string[],
) {
    const ctx = Context.wrap(wrappable);
    const args = ctx.isMessage() ? ['text', messageArgs!] : ['slash', ctx.options];
    return [ctx, args] as [Context, Args];
}


export function interactionArg<T extends BaseInteraction>(interaction: T) {
    return [interaction] as [T];
}

function intoPayload(module: Processed<Module>) {
    return pipe(
        arrayifySource,
        map(args => ({ module, args })),
    );
}

const createResult = createResultResolver<
    Processed<Module>,
    { module: Processed<Module>; args: unknown[] },
    unknown[]
>({
    createStream: ({ module, args }) => from(module.onEvent).pipe(callPlugin(args)),
    onNext: ({ args }) => args,
});
/**
 * Creates an observable from { source }
 * @param module
 * @param source
 */
export function eventDispatcher(module: Processed<Module>, source: unknown) {
    assert.ok(source instanceof EventEmitter, `${source} is not an EventEmitter`);

    const execute: OperatorFunction<unknown[], unknown> = concatMap(async args =>
        module.execute(...args),
    );
    return fromEvent(source, module.name).pipe(
        intoPayload(module),
        concatMap(createResult),
        execute,
    );
}

export function createDispatcher(payload: {
    module: Processed<CommandModule>;
    event: BaseInteraction;
}) {
    switch (payload.module.type) {
        case CommandType.Text:
            throw Error(SernError.MismatchEvent + ' Found a text module in interaction stream. ' + payload.module);
        case CommandType.Slash:
        case CommandType.Both: {
            if (isAutocomplete(payload.event)) {
                /**
                 * Autocomplete is a special case that
                 * must be handled separately, since it's
                 * too different from regular command modules
                 * CAST SAFETY: payload is already guaranteed to be a slash command or both command
                 */
                return dispatchAutocomplete(payload as never);
            }
            return dispatchInteraction(payload, contextArgs);
        }
        default:
            return dispatchInteraction(payload, interactionArg);
    }
}
