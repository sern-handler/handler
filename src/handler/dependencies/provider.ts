import type { NodeApi } from 'iti';
import { SernError } from '../structures/errors';
import { BehaviorSubject } from 'rxjs';
import * as assert from 'assert';
import type { RequiredDependencies } from '../../types/handler';

export const containerSubject = new BehaviorSubject<NodeApi<RequiredDependencies & Record<string,unknown>> | null>(null);
export function requireDependencies<T>(root: NodeApi<T>) {
    const tokens = Object.values(root.getTokens());
    const hasRequiredDependencies = tokens.includes('@sern/client');
    assert.ok(hasRequiredDependencies, SernError.MissingRequired);
}

export function useContainer<T extends Record<string,unknown>>() {
    const container = containerSubject.getValue();
    assert.ok(container !== null, 'useContainer was called before Sern#init');
    return container as NodeApi<T>;
}

