/**
 * @enum { string }
 */
export enum SernError {
    /**
     * Throws when registering an invalid module.
     * This means it is undefined or an invalid command type was provided
     */
    NonValidModuleType = 'Detected an unknown module type',
    /**
     * Attempted to lookup module in command module store. Nothing was found!
     */
    UndefinedModule = `A module could not be detected`,
    /**
     * Attempted to lookup module in command module store. Nothing was found!
     */
    MismatchModule = `A module type mismatched with event emitted!`,
    NotSupportedInteraction = `This interaction is not supported.`,
    PluginFailure = `A plugin failed to call controller.next()`,
    MismatchEvent = `You cannot use message when an interaction fired or vice versa`,
    NotSupportedYet = `This feature is not supported yet`,
}
