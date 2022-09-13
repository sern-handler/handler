import type { NodeApi } from 'iti';
import { SernError } from '../structures/errors';

export function requireDependencies(root: NodeApi<Record<string,unknown>>) {
    const tokens = Object.values(root.getTokens());

    const hasRequiredDependencies = tokens.includes('@sern/client');
    if (!hasRequiredDependencies) {
        throw Error(SernError.RequiredNotFound);
    }

}
