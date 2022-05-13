export enum SernError {
    ReservedEvent = 'Cannot register the reserved ready event. Please use the init property.',
    NoAlias = 'You cannot provide an array with elements to a slash command.',
    NonValidModuleType = 'Detected an unknown module type',
    UndefinedModule = `A module could not be detected at`,
    MismatchModule = `A module type mismatched with event emitted!`,
}
