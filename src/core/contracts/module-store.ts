/**
 * Represents a core module store that stores IDs mapped to file paths.
 */
export interface CoreModuleStore {
    commands : Map<string, string>;
}
