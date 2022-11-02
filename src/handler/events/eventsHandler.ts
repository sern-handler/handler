import type Wrapper from '../structures/wrapper';
import { Subject, type Observable } from 'rxjs';
import type { EventEmitter } from 'events';
import type SernEmitter from '../sernEmitter';
import type { ErrorHandling } from '../contracts';
import { handleError } from '../contracts/errorHandling';

export abstract class EventsHandler<T> {
    protected payloadSubject = new Subject<T>();
    protected abstract discordEvent: Observable<unknown>;
    protected client: EventEmitter;
    protected emitter: SernEmitter;
    protected crashHandler: ErrorHandling;
    protected constructor({ containerConfig }: Wrapper) {
        const [client, emitter, crash] = containerConfig.get('@sern/client', '@sern/emitter', '@sern/errors');
        this.client = client as EventEmitter;
        this.emitter = emitter as SernEmitter;
        this.crashHandler = crash as ErrorHandling;
    }
    protected abstract init(): void;
    protected abstract setState(state: T): void;
}
