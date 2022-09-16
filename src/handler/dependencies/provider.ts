import type { NodeApi } from 'iti';
import { SernError } from '../structures/errors';
import { BehaviorSubject } from 'rxjs';
import { Err, Ok } from 'ts-results-es';
import { makeRoot } from 'iti';
import type { RequiredDependencies } from '../../types/handler';
import { EventEmitter } from 'events';

export const containerSubject = new BehaviorSubject<NodeApi<Record<string,unknown>> | null>(null);
export function requireDependencies(root: NodeApi<Record<string,unknown>>) {
    const tokens = Object.values(root.getTokens());

    const hasRequiredDependencies = tokens.includes('@sern/client');
    if (!hasRequiredDependencies) {
        return Err(SernError.RequiredNotFound);
    }
    return Ok(root);
}

export function useContainer() {
    const container = containerSubject.getValue();
    if(container === null) throw Error('useContainer was called before Sern#init');
    return {
        container,
    };
}

export function makeDependencies(
    cb: (root : NodeApi<{}>) => NodeApi<RequiredDependencies & Record<string,unknown>>
) : NodeApi<RequiredDependencies> {
    return cb(makeRoot());
}