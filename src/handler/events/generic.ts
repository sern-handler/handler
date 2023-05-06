import { BaseInteraction, ChatInputCommandInteraction, Interaction, InteractionType } from "discord.js";
import { Observable, filter, map } from "rxjs";
import { CommandType, ModuleManager } from "../../core";
import { SernError } from '../../core/structures/errors'
import { filterMap } from '../../core/operators';
import { defaultModuleLoader } from "../../core/module-loading";
import { Processed } from "../../types/core";
import { BothCommand, CommandModule } from "../../types/module";
import { contextArgs, dispatchAutocomplete, dispatchCommand, interactionArg } from "./dispatchers";
import { isAutocomplete } from "../../core/predicates";
import { err } from "../../core/functions";
import { ObservableInput, pipe, switchMap} from "rxjs";
import { SernEmitter } from "../../core";
import { errTap } from '../../core/operators';
import * as Files from '../../core/module-loading';
import { sernMeta } from "../../commands";
import { AnyModule } from "../../types/module";

/**
 *
 * Creates an RxJS observable that filters and maps incoming interactions to their respective modules.
 * @param i An RxJS observable of interactions.
 * @param mg The module manager instance used to retrieve the module path for each interaction.
 * @returns A handler to create a RxJS observable of dispatchers that take incoming interactions and execute their corresponding modules.
 */
export function createHandler<T extends BaseInteraction>(
    i: Observable<Interaction>,
    mg: ModuleManager,
) {
    return (pred: (i: BaseInteraction) => i is T) =>
        i.pipe(
            filter(pred),
            filterMap(event => {
                const fullPath = mg.get(createId(event as unknown as Interaction))
                if(!fullPath) return err();
                return defaultModuleLoader<CommandModule>(fullPath)
                    .then(res => res.map(module => ({ module, event }) ))
            }),
            map(createDispatcher)
       ) 
}
/**
 * Creates a unique ID for a given interaction object.
 * @param event The interaction object for which to create an ID.
 * @returns A unique string ID based on the type and properties of the interaction object.
 */
function createId<T extends Interaction>(event: T) {
        let id: string;
        switch(event.type) {
            case InteractionType.MessageComponent: {
                id = `${event.customId}__C${event.componentType}`;
            } break;
            case InteractionType.ApplicationCommand:
            case InteractionType.ApplicationCommandAutocomplete: {
                id = `${event.commandName}__A${event.commandType}`;
                console.log(id)
            } break;
            case InteractionType.ModalSubmit: {
                id = `${event.customId}__C1`;
            } break;
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
            throw Error(SernError.MismatchEvent+ " Found a text module in interaction stream.");
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
    input: ObservableInput<string>, sernEmitter: SernEmitter
) {
    return pipe(
        switchMap(() => Files.buildModuleStream<T>(input)),
        errTap(error => {
            sernEmitter.emit('module.register', SernEmitter.failure(undefined, error));
        }),
        map(module => ({ module, absPath: module[sernMeta].fullPath }))
    );
}

