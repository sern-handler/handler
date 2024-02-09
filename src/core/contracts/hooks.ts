
/**
 * Represents an initialization contract.
 * Let dependencies implement this to initiate some logic.
 */
export interface Init {
    init(): unknown;
}

/**
 * Represents a Disposable contract.
 * Let dependencies implement this to dispose and cleanup.
 */
export interface Disposable {
    dispose(): unknown;
}
