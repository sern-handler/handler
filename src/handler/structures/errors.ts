export enum SernError {
    NonValidModuleType = 'Detected an unknown module type',
    UndefinedModule = `A module could not be detected at`,
    MismatchModule = `A module type mismatched with event emitted!`,
    NotSupportedInteraction = `This interaction is not supported.`,
    PluginFailure = `A plugin failed to call controller.next()`,
    MismatchEvent = `You cannot use message when an interaction fired or vice versa`,
    UndefinedSernEmitter = `Could not find a Sern emitter`,
}
