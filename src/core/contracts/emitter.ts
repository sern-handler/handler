/**
 * A contract representing an object that can emit events.
 */
export interface Emitter {
    /**
     * Emits an event with an optional payload.
     * @method
     * @param {string | symbol} eventName - The name of the event to emit.
     * @param {...any[]} payload - Optional arguments or data associated with the event.
     * @returns {boolean} `true` if any listeners were called, otherwise `false`.
     */
    emit(eventName: string | symbol, ...payload: any[]): boolean;
}
