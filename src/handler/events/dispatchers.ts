import Context from '../structures/context';
import type { DefinedEventModule, SlashOptions } from '../../types/handler';
import { arrAsync } from '../utilities/arrAsync';
import type {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Interaction,
    Message,
} from 'discord.js';
import { SernError } from '../structures/errors';
import treeSearch from '../utilities/treeSearch';
import type { BothCommand, CommandModule, Module, SlashCommand } from '../../types/module';
import { EventEmitter } from 'events';
import * as assert from 'assert';
import { reduceResults$ } from './observableHandling';
import { concatMap, fromEvent, map, Observable, of } from 'rxjs';
import type { CommandArgs } from '../plugins';
import type { CommandType, PluginType } from '../structures/enums';
import { Err } from 'ts-results-es';
import { isEmpty } from '../utilities/functions';

export function dispatcher(
    module: Module,
    createArgs: () => unknown[],
) {
    const args = createArgs();
    return {
        module,
        execute: () => module.execute(...args),
        controlResult: () => arrAsync(module.onEvent.map(plugs => plugs.execute(...args))),
    };
}

export function commandDispatcher<V extends CommandType>(
    module: CommandModule,
    createArgs: () => CommandArgs<V, PluginType.Control>,
) {
    return dispatcher(module, createArgs);
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
    const arrayifySource$ = (src: Observable<unknown>) => src.pipe(map(event => Array.isArray(event) ? event : [event]));
    const createResult$ = (src: Observable<any[]>) => {
        if(isEmpty(module.onEvent)) {
            const promisifiedPlugins = (args: any[]) => module.onEvent.map(plugin => plugin.execute(...args));
            return src.pipe(
                concatMap(args => of(args)
                    .pipe(
                        //Awaits all the plugins and executes them,
                        concatMap(args => Promise.all(promisifiedPlugins(args))),
                        reduceResults$,
                        map(success => ({ success, args }))
                    )
                ),
            );
        } else {
            return src.pipe(map(args => ({ success: true, args })));
        }
    };
    const execute$ = (src: Observable<{ success: boolean, args: any[] }>) => src.pipe(
        concatMap(({success, args}) =>
            Promise.resolve(success ? module.execute(...args) : Err.EMPTY)
        )
    );
    return fromEvent(source, module.name)
        .pipe(
            arrayifySource$,
            createResult$,
            execute$
        );
}

export function contextArgs(i: Interaction | Message) {
    const ctx = Context.wrap(i as ChatInputCommandInteraction | Message);
    const args = ['slash', ctx.interaction.options];
    return () => [ctx, args] as [Context, ['slash', SlashOptions]];
}

export function interactionArg<T extends Interaction>(interaction: T) {
    return () => [interaction] as [T];
}

export function dispatchAutocomplete(module: BothCommand | SlashCommand, interaction: AutocompleteInteraction) {
    const option = treeSearch(interaction, module.options);
    if (option !== undefined) {
        return {
            module,
            execute: () => option.command.execute(interaction),
            controlResult: () => arrAsync(option.command.onEvent.map(e => e.execute(interaction))),
        };
    }
    throw Error(
        SernError.NotSupportedInteraction + ` There is no autocomplete tag for this option`,
    );
}
