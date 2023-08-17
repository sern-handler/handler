import type { Awaitable } from '../../types/utility';

/**
 * Represents a Disposable contract.
 * Let dependencies implement this to dispose and cleanup.
 */
export interface Disposable {
    dispose(): Awaitable<unknown>;
}
