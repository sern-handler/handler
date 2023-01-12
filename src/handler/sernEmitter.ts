import { EventEmitter } from 'events';
import type { Payload, SernEventsMapping } from '../types/handler';
import { PayloadType } from './structures/enums';
import type { Module } from '../types/module';

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
    private static payload<T extends Payload>(
        type: PayloadType,
        module?: Module,
        reason?: unknown,
    ) {
        return { type, module, reason } as T;
    }
    static failure(module?: Module, reason?: unknown) {
        //The generic cast Payload & { type : PayloadType.* } coerces the type to be a failure payload
        // same goes to the other methods below
        return SernEmitter.payload<Payload & { type: PayloadType.Failure }>(
            PayloadType.Failure,
            module,
            reason,
        );
    }
    static success(module: Module) {
        return SernEmitter.payload<Payload & { type: PayloadType.Success }>(
            PayloadType.Success,
            module,
        );
    }
    static warning(reason: unknown) {
        return SernEmitter.payload<Payload & { type: PayloadType.Warning }>(
            PayloadType.Warning,
            undefined,
            reason,
        );
    }
}

export default SernEmitter;
