import type Wrapper from '../structures/wrapper';
import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';

export abstract class EventsHandler<T> {
    protected payloadSubject = new Subject<T>();
    protected abstract discordEvent: Observable<unknown>;
    protected constructor(protected wrapper: Wrapper) {}
    protected abstract init(): void;
    protected abstract setState(state: T): void;
}
