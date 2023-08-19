import { AnyFunction } from "../../types/utility";

/**
 * A contract representing an object that can manage event listeners.
 */
export interface Listener {
    /**
     * Adds a listener for a specific event.
     * @method
     * @param {string | symbol} eventName - The name of the event to listen to.
     * @param {AnyFunction} listener - The listener function to be invoked when the event is emitted.
     * @returns {this} The listener object itself, supporting method chaining.
     */
    addListener(eventName: string | symbol, listener: AnyFunction): this;

    /**
     * Removes a listener for a specific event.
     * @method
     * @param {string | symbol} eventName - The name of the event to remove the listener from.
     * @param {AnyFunction} listener - The listener function to be removed.
     * @returns {this} The listener object itself, supporting method chaining.
     */
    removeListener(eventName: string | symbol, listener: AnyFunction): this;
}
