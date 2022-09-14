/**
 * @enum { string }
 */
export enum SernError {
    /**
     * Throws when registering an invalid module.
     * This means it is undefined or an invalid command type was provided
     */
    InvalidModuleType = 'Detected an unknown module type',
    /**
     * Attempted to lookup module in command module store. Nothing was found!
     */
    UndefinedModule = `A module could not be detected`,
    /**
     * Attempted to lookup module in command module store. Nothing was found!
     */
    MismatchModule = `A module type mismatched with event emitted!`,
    /**
     * Unsupported interaction at this moment.
     */
    NotSupportedInteraction = `This interaction is not supported.`,
    /**
     * One plugin called `controller.stop()` (end command execution / loading)
     */
    PluginFailure = `A plugin failed to call controller.next()`,
    /**
     * A crash that occurs when accessing an invalid property of Context
     */
    MismatchEvent = `You cannot use message when an interaction fired or vice versa`,
    /**
     * Unsupported feature attempted to access at this time
     */
    NotSupportedYet = `This feature is not supported yet`,
    /**
     * Required dependencies not found
     */
    RequiredNotFound = `@sern/client is required`
}
