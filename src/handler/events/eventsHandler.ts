import type Wrapper from '../structures/wrapper';
import { Subject, type Observable } from 'rxjs';
import type { EventEmitter } from 'events';
import type SernEmitter from '../sernEmitter';

export abstract class EventsHandler<T> {
    protected payloadSubject = new Subject<T>();
    protected abstract discordEvent: Observable<unknown>;
    protected client: EventEmitter;
    protected emitter: SernEmitter;
    protected constructor(protected wrapper: Wrapper) {
        const [client, emitter] = wrapper.containerConfig.get('@sern/client', '@sern/emitter');
        this.client = client as EventEmitter;
        this.emitter = emitter as SernEmitter;
    }
    protected abstract init(): void;
    protected abstract setState(state: T): void;
}
