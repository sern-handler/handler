import type { DefinedEventModule } from '../../../types/handler';
import type {
    AutocompleteInteraction,
} from 'discord.js';
import { SernError } from '../../structures/errors';
import treeSearch from '../../utilities/treeSearch';
import type { BothCommand, Module, SlashCommand } from '../../../types/module';
import { EventEmitter } from 'events';
import * as assert from 'assert';
import { concatMap, from, fromEvent, map, Observable, OperatorFunction, pipe } from 'rxjs';
import { callPlugin } from '../operators';
import { createResultResolver } from '../observableHandling';

export function dispatchCommand(
    module: Module,
    createArgs: () => unknown[],
) {
    const args = createArgs();
    return {
        module,
        args,
    };
}

/**
 * Creates an observable from { source }
 * @param module
 * @param source
 */
export function eventDispatcher(
    module: DefinedEventModule,
    source: unknown,
) {
    assert.ok(source instanceof EventEmitter, `${source} is not an EventEmitter`);
    /**
     * Sometimes fromEvent emits a single parameter, which is not an Array. This
     * operator function flattens events into an array
     * @param src
     */
    const arrayify = pipe(
        map(event => Array.isArray(event) ? event : [event]),
        map( args => ({ module, args }))
    );
    const createResult = createResultResolver<DefinedEventModule, { module: DefinedEventModule; args: any[] }, any[]>({
        onSuccess: ({ args } ) => args,
        createStream: ({ module, args } ) => from(module.onEvent).pipe(callPlugin(args)),
    });
    const execute: OperatorFunction<any[], any> = pipe(
        concatMap(async args => module.execute(...args))
    );
    return fromEvent(source, module.name)
        .pipe(
            arrayify,
            concatMap(createResult),
            execute
        );
}

export function dispatchAutocomplete(module: BothCommand | SlashCommand, interaction: AutocompleteInteraction) {
    const option = treeSearch(interaction, module.options);
    if (option !== undefined) {
        return {
            module,
            args: [interaction],
        };
    }
    throw Error(
        SernError.NotSupportedInteraction + ` There is no autocomplete tag for this option`,
    );
}
