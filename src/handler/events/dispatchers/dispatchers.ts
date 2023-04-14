import type { Processed } from '../../../types/handler';
import type { AutocompleteInteraction } from 'discord.js';
import { SernError } from '../../../core/structures';
import treeSearch from '../../../core/utilities/treeSearch';
import type { BothCommand, CommandModule, Module, SlashCommand } from '../../../types/module';
import { EventEmitter } from 'events';
import * as assert from 'assert';
import { concatMap, from, fromEvent, map, OperatorFunction, pipe } from 'rxjs';
import { arrayifySource, callPlugin } from '../operators';
import { createResultResolver } from '../observableHandling';

export function dispatchCommand(module: Processed<CommandModule>, createArgs: () => unknown[]) {
    const args = createArgs();
    return {
        module,
        args,
    };
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

export function dispatchAutocomplete(
    module: Processed<BothCommand | SlashCommand>,
    interaction: AutocompleteInteraction,
) {
    const option = treeSearch(interaction, module.options);
    if (option !== undefined) {
        return {
            module: option.command as Processed<Module>, //autocomplete is not a true "module" warning cast!
            args: [interaction],
        };
    }
    throw Error(
        SernError.NotSupportedInteraction + ` There is no autocomplete tag for this option`,
    );
}
