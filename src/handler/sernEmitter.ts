import { EventEmitter } from 'events';
import type { Module } from './structures/module';

type Payload =
    | { success: true; module: Module }
    | { success: false; module: Module | undefined; reason: string | Error };

type SernEventsMapping = {
    ['module.register']: [Payload];
    ['module.activate']: [Payload];
    ['error']: [Error | string];
};

/**
 *
 */
export default class SernEmitter extends EventEmitter {
    public override on<T extends keyof SernEventsMapping>(
        eventName: T,
        listener: (...args: SernEventsMapping[T][]) => void,
    ): this {
        return super.on(eventName, listener);
    }

    public override once<T extends keyof SernEventsMapping>(
        eventName: T,
        listener: (...args: SernEventsMapping[T][]) => void,
    ): this {
        return super.once(eventName, listener);
    }

    public override emit<T extends keyof SernEventsMapping>(
        eventName: T,
        ...args: SernEventsMapping[T]
    ): boolean {
        return super.emit(eventName, ...args);
    }
}
