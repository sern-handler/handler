export enum SernError {
    ReservedEvent = 'Cannot register the reserved ready event. Please use the init property.',
    NoAlias = 'You cannot provide an array with elements to a slash command.',
    NonValidModuleType = 'Detected an unknown module type',
    UndefinedModule = `A module could not be detected at`,
    MismatchModule = `A module type mismatched with event emitted!`,
    NotImplemented = 'This feature has not yet been implemented',
    NotSupportedInteraction = `This interaction is not supported.`,
    NotValidEventName = `Supplied a non valid event name`,
    PluginFailure = `A plugin failed to call controller.next()`,
}
