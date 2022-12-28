import { EventEmitter } from 'events';
import type { SernEventsMapping } from '../types/handler';

class SernEmitter extends EventEmitter {
    /**
     * Listening to sern events with on. This event stays on until a crash or a normal exit
     * @param eventName
     * @param listener what to do with the data
     */
    public override on<T extends keyof SernEventsMapping>(
        eventName: T,
        listener: (...args: SernEventsMapping[T][]) => void,
    ): this {
        return super.on(eventName, listener);
    }
    /**
     * Listening to sern events with on. This event stays on until a crash or a normal exit
     * @param eventName
     * @param listener what to do with the data
     */
    public override once<T extends keyof SernEventsMapping>(
        eventName: T,
        listener: (...args: SernEventsMapping[T][]) => void,
    ): this {
        return super.once(eventName, listener);
    }
    /**
     * Listening to sern events with on. This event stays on until a crash or a normal exit
     * @param eventName
     * @param args the arguments for emitting the eventName
     */
    public override emit<T extends keyof SernEventsMapping>(
        eventName: T,
        ...args: SernEventsMapping[T]
    ): boolean {
        return super.emit(eventName, ...args);
    }
}

export default SernEmitter;
