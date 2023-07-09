import type { Awaitable } from '../../types/utility';

/**
 * Represents an initialization contract.
 * Let dependencies implement this to initiate some logic.
 */
export interface Init {
    init(): Awaitable<unknown>;
}
