import { ChatInputCommandInteraction, Interaction, InteractionType } from 'discord.js';
import {
    catchError,
    concatMap,
    EMPTY,
    filter,
    finalize,
    fromEvent,
    map,
    Observable,
    of,
    OperatorFunction,
    pipe,
} from 'rxjs';
import { CommandType,SernError } from '../../core/structures';
import { contextArgs, dispatchAutocomplete, dispatchCommand, interactionArg } from './dispatchers';
import { executeModule, makeModuleExecutor } from './observableHandling';
import type { CommandModule } from '../../types/module';
import { ErrorHandling, handleError } from '../../core/contracts/errorHandling';
import { SernEmitter, WebsocketStrategy } from '../../core';
import type { Processed } from '../../types/handler';
import { useContainerRaw } from '../../core/dependencies';
import type { Logging, ModuleManager } from '../../core/contracts';
import type { EventEmitter } from 'node:events';
import { ModuleGetter, createModuleGetter } from '../../core/contracts/moduleManager';


function handleMessageComponents(i: Observable<Interaction>, mg: ModuleGetter) {
    return i.pipe(
        filter(e => e.isMessageComponent()),
        map(event => ({ module: mg('' as any), event }) )
    )
}

function handleAutocomplete(i: Observable<Interaction>, mg: ModuleGetter) {
    return i.pipe(
        filter(e => e.isAutocomplete()),
        map(event => ({ module: mg('' as any), event }) )
    )
}

function handleApplicationCommands(i: Observable<Interaction>, mg: ModuleGetter) {
    return i.pipe(
        filter(e => e.isCommand()),
        map(event => ({ module: mg('' as any), event }) )
    )
}

function handleModal(i: Observable<Interaction>, mg: ModuleGetter) {
    return i.pipe(
        filter(e => e.isModalSubmit()),
        map(event => ({ module: mg('' as any), event }) )
    )
}
function makeInteractionProcessor(
    modules: ModuleManager,
): OperatorFunction<Interaction, { module: Processed<CommandModule>; event: Interaction }> {
    const get = createModuleGetter(modules);
    return pipe(
        concatMap(event => {
            switch(event.type) {
                case InteractionType.MessageComponent:
                case InteractionType.ModalSubmit: {
                   const id = `${event.customId}__M${event.componentType}` 
                } break;
                case InteractionType.ApplicationCommand:
                case InteractionType.ApplicationCommandAutocomplete: {

                }

            }
            if (event.isMessageComponent()) {
                const customId = event.customId;
                const module = get(ms => {
                    return ms.InteractionHandlers[event.componentType].get(customId);
                });
                return of({ module, event });
            } else if (event.isCommand() || event.isAutocomplete()) {
                const commandName = event.commandName;
                const module = get(
                    ms =>
                        /**
                         * try to fetch from ApplicationCommands, if nothing, try BothCommands
                         * exists on the API but not sern
                         */
                        ms.ApplicationCommands[event.commandType].get(commandName) ??
                        ms.BothCommands.get(commandName),
                );
                return of({ module, event });
            } else if (event.isModalSubmit()) {
                const module = get(ms => ms.ModalSubmit.get(event.customId));
                return of({ module, event });
            } else return EMPTY;
        }),
        filter(m => m.module !== undefined),
    ) as OperatorFunction<Interaction, { module: Processed<CommandModule>; event: Interaction }>;
}

export function makeInteractionCreate([s, err, log, modules, client]: [
    SernEmitter,
    ErrorHandling,
    Logging | undefined,
    ModuleManager,
    EventEmitter
],
    platform: WebsocketStrategy 
) {
    //map. If nothing again,this means a slash command
    const interactionStream$ = fromEvent(client, platform.eventNames[0]) as Observable<Interaction>;
    const interactionProcessor = makeInteractionProcessor(modules);
    return interactionStream$
        .pipe(
            interactionProcessor,
            map(createDispatcher),
            makeModuleExecutor(module => {
                s.emit('module.activate', SernEmitter.failure(module, SernError.PluginFailure));
            }),
            concatMap(module => executeModule(s, module)),
            catchError(handleError(err, log)),
            finalize(() => {
                log?.info({
                    message: 'interactionCreate stream closed or reached end of lifetime',
                });
                useContainerRaw()
                    ?.disposeAll()
                    .then(() => log?.info({ message: 'Cleaning container and crashing' }));
            }),
        )
        .subscribe();
}

function createDispatcher({
    module,
    event,
}: {
    event: Interaction;
    module: Processed<CommandModule>;
}) {
    switch (module.type) {
        case CommandType.Text:
            throw Error(SernError.MismatchEvent);
        case CommandType.Slash:
        case CommandType.Both: {
            if (event.isAutocomplete()) {
                /**
                 * Autocomplete is a special case that
                 * must be handled separately, since it's
                 * too different from regular command modules
                 */
                return dispatchAutocomplete(module, event);
            } else {
                return dispatchCommand(module, contextArgs(event as ChatInputCommandInteraction));
            }
        }
        default:
            return dispatchCommand(module, interactionArg(event));
    }
}
