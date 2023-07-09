import type { AnyFunction } from '../../types/utility';

export interface Emitter {
    addListener(eventName: string | symbol, listener: AnyFunction): this;
    removeListener(eventName: string | symbol, listener: AnyFunction): this;
    emit(eventName: string | symbol, ...payload: any[]): boolean;
}
