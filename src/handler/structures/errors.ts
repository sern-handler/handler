export enum SernError {
    RESERVED_EVENT = 'Cannot register the reserved ready event. Please use the init property.',
    NO_ALIAS = 'You cannot provide an array with elements to a slash command.',
    NOT_VALID_MOD_TYPE = 'Detected an unknown module type',
    UNDEFINED_MODULE = `A module could not be detected at`
    MISMATCH_MODULE_TYPE = `A module type mismatched with event emitted!`
}
