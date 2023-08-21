import { AnyFunction } from "../../types/utility"
import { Listener } from "./listener"

type AddListenerArgs<T> = { source: T, name: PropertyKey, handler: AnyFunction }
type RemoveListenerArgs<T> = { source: T, name: PropertyKey, handler: AnyFunction, unsubscribe: unknown }
type ListenerAdapterArgs<T> = {
    source: T,
    addListener: (args: AddListenerArgs<T>) => any
    removeListener: (args: RemoveListenerArgs<T>) => any 
}

/**
 * @example 
 * import { createNanoEvents } from 'nanoevents'
 *
 * // Now, we can pass this into dependencies and register this incompatible emitter into sern.
 * const listener = listenerAdapter({
 *    source: createNanoEvents(),
 *    addListener: ({ source, name, listener }) => source.on(name, handler),
 *    removeListener: ({ unsubscribe }) => unsubscribe()
 * });
 *
 * 
 * Creates a listener adapter that adds and removes listeners from an emittable object.
 * @param {ListenerAdapterArgs} options - Options for creating the listener adapter.
 * @returns {Listener} A listener adapter object that satisfies the Listener contract.
 */
export const listenerAdapter = <T>(options: ListenerAdapterArgs<T>) => {
    const { source, addListener, removeListener } = options;
    let maybeUnsub : unknown;
    return {
        source,
        addListener(eventName: string | symbol, handler: AnyFunction) {
            maybeUnsub = addListener({ source, name: eventName, handler });
            return this;
        },
        removeListener(eventName: string | symbol, handler: AnyFunction) {
            removeListener({ source, name: eventName, handler, unsubscribe: maybeUnsub });
            return this;
        }
    } satisfies Listener & { source: T }
}



