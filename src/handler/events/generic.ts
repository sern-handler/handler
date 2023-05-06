import {
    BaseInteraction,
    ChatInputCommandInteraction,
    Interaction,
    InteractionType,
    Message,
} from 'discord.js';
import { Observable, filter, map } from 'rxjs';
import { CommandType, ModuleManager } from '../../core';
import { SernError } from '../../core/structures/errors';
import { filterMap } from '../../core/operators';
import { defaultModuleLoader } from '../../core/module-loading';
import { Processed } from '../../types/core';
import { BothCommand, CommandModule, Module } from '../../types/module';
import { contextArgs, dispatchAutocomplete, dispatchCommand, interactionArg } from './dispatchers';
import { isAutocomplete } from '../../core/predicates';
import { ObservableInput, pipe, switchMap } from 'rxjs';
import { SernEmitter } from '../../core';
import { errTap } from '../../core/operators';
import * as Files from '../../core/module-loading';
import { sernMeta } from '../../commands';
import { AnyModule } from '../../types/module';
import { Err, Result } from 'ts-results-es';
import { Awaitable } from '../../types/handler';
import { fmt } from './messages';

function createGenericHandler<Source, Narrowed extends Source, Output>(
    source: Observable<Source>,
    makeModule: (event: Narrowed) => Awaitable<Result<Output, unknown>>,
) {
    return (pred: (i: Source) => i is Narrowed) => source.pipe(filter(pred), filterMap(makeModule));
}
/**
 *
 * Creates an RxJS observable that filters and maps incoming interactions to their respective modules.
 * @param i An RxJS observable of interactions.
 * @param mg The module manager instance used to retrieve the module path for each interaction.
 * @returns A handler to create a RxJS observable of dispatchers that take incoming interactions and execute their corresponding modules.
 */
export function createInteractionHandler<T extends Interaction>(
    source: Observable<Interaction>,
    mg: ModuleManager,
) {
    return createGenericHandler<Interaction, T, ReturnType<typeof createDispatcher>>(
        source,
        event => {
            const fullPath = mg.get(createId(event as unknown as Interaction));
            if (!fullPath)
                return Err(SernError.UndefinedModule + ' No full path found in module store');
            return defaultModuleLoader<CommandModule>(fullPath).then(res =>
                res.map(module => createDispatcher({ module, event })),
            );
        },
    );
}

export function createMessageHandler(
    source: Observable<Message>,
    defaultPrefix: string,
    mg: ModuleManager,
) {
    return createGenericHandler(source, event => {
        const [prefix, ...rest] = fmt(event.content, defaultPrefix);
        const fullPath = mg.get(`${prefix}__A0`);
        if (fullPath === undefined) {
            return Err(SernError.UndefinedModule + ' No full path found in module store');
        }
        return defaultModuleLoader<CommandModule>(fullPath).then(result => {
            const args = contextArgs(event, rest);
            return result.map(module => dispatchCommand(module, args));
        });
    });
}
/**
 * Creates a unique ID for a given interaction object.
 * @param event The interaction object for which to create an ID.
 * @returns A unique string ID based on the type and properties of the interaction object.
 */
function createId<T extends Interaction>(event: T) {
    let id: string;
    switch (event.type) {
        case InteractionType.MessageComponent:
            {
                id = `${event.customId}__C${event.componentType}`;
            }
            break;
        case InteractionType.ApplicationCommand:
        case InteractionType.ApplicationCommandAutocomplete:
            {
                id = `${event.commandName}__A${event.commandType}`;
                console.log(id);
            }
            break;
        case InteractionType.ModalSubmit:
            {
                id = `${event.customId}__C1`;
            }
            break;
    }
    return id;
}

function createDispatcher({
    module,
    event,
}: {
    module: Processed<CommandModule>;
    event: BaseInteraction;
}) {
    switch (module.type) {
        case CommandType.Text:
            throw Error(SernError.MismatchEvent + ' Found a text module in interaction stream.');
        case CommandType.Slash:
        case CommandType.Both: {
            if (isAutocomplete(event)) {
                /**
                 * Autocomplete is a special case that
                 * must be handled separately, since it's
                 * too different from regular command modules
                 */
                return dispatchAutocomplete(module as Processed<BothCommand>, event);
            }
            return dispatchCommand(module, contextArgs(event as ChatInputCommandInteraction));
        }
        default:
            return dispatchCommand(module, interactionArg(event));
    }
}

export function buildModules<T extends AnyModule>(
    input: ObservableInput<string>,
    sernEmitter: SernEmitter,
) {
    return pipe(
        switchMap(() => Files.buildModuleStream<T>(input)),
        errTap(error => {
            sernEmitter.emit('module.register', SernEmitter.failure(undefined, error));
        }),
        map(module => ({ module, absPath: module[sernMeta].fullPath })),
    );
}
