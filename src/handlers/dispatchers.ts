import { EventEmitter } from 'node:events';
import * as assert from 'node:assert';
import { concatMap, from, fromEvent, map, OperatorFunction, pipe } from 'rxjs';
import {
    arrayifySource,
    callPlugin,
    isAutocomplete,
    treeSearch,
    SernError,
} from '../core/_internal';
import { createResultResolver } from './event-utils';
import { AutocompleteInteraction, BaseInteraction, Message } from 'discord.js';
import { CommandType, Context } from '../core';
import type { Args } from '../types/utility';
import type { BothCommand, CommandModule, Module, Processed } from '../types/core-modules';

function dispatchAutocomplete(payload: {
    module: Processed<BothCommand>;
    event: AutocompleteInteraction;
}) {
    const option = treeSearch(payload.event, payload.module.options);
    assert.ok(
        option,
        Error(SernError.NotSupportedInteraction + ` There is no autocomplete tag for this option`),
    );
    return {
        module: option.command as Processed<Module>, //autocomplete is not a true "module" warning cast!
        args: [payload.event],
    };
}

export function contextArgs(wrappable: Message | BaseInteraction, messageArgs?: string[]) {
    const ctx = Context.wrap(wrappable);
    const args = ctx.isMessage() ? ['text', messageArgs!] : ['slash', ctx.options];
    return [ctx, args] as [Context, Args];
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
    assert.ok(
        CommandType.Text !== payload.module.type,
        SernError.MismatchEvent + 'Found text command in interaction stream',
    );
    switch (payload.module.type) {
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
            return {
                module: payload.module,
                args: contextArgs(payload.event),
            };
        }
        default: return { 
            module: payload.module,
            args: [payload.event],
        };
    }
}
