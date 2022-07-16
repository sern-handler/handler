import type Wrapper from '../structures/wrapper';
import { Subject, type Observable } from 'rxjs';

export abstract class EventsHandler<T> {
    protected payloadSubject = new Subject<T>();
    protected abstract discordEvent: Observable<unknown>;
    protected constructor(protected wrapper: Wrapper) {}
    protected abstract init(): void;
    protected abstract setState(state: T): void;
}
