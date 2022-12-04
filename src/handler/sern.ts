import type Wrapper from './structures/wrapper';
import { processEvents } from './events/userDefinedEventsHandling';
import { CommandType, EventType, PluginType } from './structures/enums';
import type {
    BasePlugin,
    CommandPlugin,
    EventModuleCommandPluginDefs,
    EventModuleEventPluginDefs,
    EventPlugin,
    InputCommandModule,
    InputEventModule,
} from './plugins/plugin';
import InteractionHandler from './events/interactionHandler';
import ReadyHandler from './events/readyHandler';
import MessageHandler from './events/messageHandler';
import type { CommandModule, CommandModuleDefs, EventModule, EventModuleDefs } from '../types/module';
import { Container, createContainer } from 'iti';
import type { Dependencies, OptionalDependencies } from '../types/handler';
import { composeRoot, containerSubject, useContainer } from './dependencies/provider';
import type { Logging } from './contracts';
import { err, ok, partition } from './utilities/functions';
import type {
    APIButtonComponent,
    APISelectMenuComponent,
    Awaitable,
    ButtonInteraction,
    Interaction,
} from 'discord.js';
import { concatMap, filter, from, fromEvent, Observable, switchMap, take, takeWhile } from 'rxjs';
import { SelectMenuInteraction } from 'discord.js';

/**
 *
 * @param wrapper Options to pass into sern.
 * Function to start the handler up
 * @example
 * ```ts title="src/index.ts"
 * Sern.init({
 *     client,
 *     defaultPrefix: '!',
 *     commands: 'dist/commands',
 * })
 * ```
 */
export function init(wrapper: Wrapper) {
    const logger = wrapper.containerConfig.get('@sern/logger')[0] as Logging | undefined;
    const startTime = performance.now();
    const { events } = wrapper;
    if (events !== undefined) {
        processEvents(wrapper);
    }
    new ReadyHandler(wrapper);
    new MessageHandler(wrapper);
    new InteractionHandler(wrapper);
    const endTime = performance.now();
    logger?.info({ message: `sern : ${(endTime-startTime).toFixed(2)} ms` });
}

/**
 * The object passed into every plugin to control a command's behavior
 */
export const controller = {
    next: ok,
    stop: err,
};

/**
 * The wrapper function to define command modules for sern
 * @param mod
 */
export function commandModule(mod: InputCommandModule): CommandModule {
    const [onEvent, plugins] = partition(mod.plugins ?? [], el => (el as BasePlugin).type === PluginType.Event);
    return {
        ...mod,
        onEvent,
        plugins,
    } as CommandModule;
}
/**
 * The wrapper function to define event modules for sern
 * @param mod
 */
export function eventModule(mod: InputEventModule): EventModule {
    const [onEvent, plugins] = partition(mod.plugins ?? [], el => (el as BasePlugin).type === PluginType.Event);
        return {
        ...mod,
        onEvent,
        plugins,
    } as EventModule;
}

export function onClick(
    button: APIButtonComponent,
    execute: (b: ButtonInteraction) => Awaitable<unknown>,
    teardown: number | ((b: ButtonInteraction) => Awaitable<boolean>) = 1
) {
    const containerReceiver = useContainer();
    const [ client ] = containerReceiver('@sern/client');
    const teardownLogic = typeof teardown === 'number'
        ? (o: Observable<Interaction>) => o.pipe(take(teardown))
        : (o: Observable<Interaction>) => o.pipe(
            concatMap(i =>
                Promise.resolve(teardown(i as ButtonInteraction))
            ),
            concatMap(condition => o.pipe(takeWhile(() => !condition, true)))
        );

    (<Observable<Interaction>>fromEvent(client, 'interactionCreate')).pipe(
        filter(i => i.isButton() && 'custom_id' in button ? button.custom_id === i.customId : true),
        teardownLogic,
        switchMap(i =>
            from(Promise.resolve(execute(i as ButtonInteraction)))
        ),
    ).subscribe();
}
export function onSubmit<T extends APISelectMenuComponent>(
    menu: T,
    execute : () => Awaitable<unknown>
) {
    return;
}

/**
 * @param conf a configuration for creating your project dependencies
 */
export function makeDependencies<T extends Dependencies>(conf: {
    exclude?: Set<OptionalDependencies>,
    build: (root: Container<Record<string, unknown>, {}>) => Container<Partial<T>, {}>,
}) {
    const container = conf.build(createContainer());
    composeRoot(container, conf.exclude ?? new Set());
    containerSubject.next(container as unknown as Container<Dependencies, {}>);
    return useContainer<T>();
}

export abstract class CommandExecutable<Type extends CommandType> {
    abstract type: Type;
    plugins: CommandPlugin<Type>[] = [];
    onEvent: EventPlugin<Type>[] = [];
    abstract execute: CommandModuleDefs[Type]['execute'];
}

export abstract class EventExecutable<Type extends EventType> {
    abstract type: Type;
    plugins: EventModuleCommandPluginDefs[Type][] = [];
    onEvent: EventModuleEventPluginDefs[Type][] = [];
    abstract execute: EventModuleDefs[Type]['execute'];
}
