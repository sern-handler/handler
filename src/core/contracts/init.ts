import { Awaitable } from '../../shared';

/**
 * Represents an initialization contract.
 * Let dependencies implement this to initiate some logic.
 */
export interface Init {
    init() : Awaitable<unknown>
}
