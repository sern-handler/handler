/**
 * @since 1.0.0
 * A bitfield that discriminates command modules
 * @enum { number }
 * @example
 * ```ts
 * export default commandModule({
 *     // highlight-next-line
 *     type : CommandType.Text,
 *     name : 'a text command'
 *     execute(message) {
 *         console.log(message.content)
 *     }
 * })
 * ```
 */
export enum CommandType {
    Text = 1 << 0,
    Slash = 1 << 1,
    Both = 3,
    CtxUser = 1 << 2,
    CtxMsg = 1 << 3,
    Button = 1 << 4,
    StringSelect = 1 << 5,
    Modal = 1 << 6,
    UserSelect = 1 << 7,
    RoleSelect = 1 << 8,
    MentionableSelect = 1 << 9,
    ChannelSelect = 1 << 10,
}

/**
 * A bitfield that discriminates event modules
 * @enum { number }
 * @example
 * ```ts
 * export default eventModule({
 *     //highlight-next-line
 *     type : EventType.Discord,
 *     name : 'guildMemberAdd'
 *     execute(member : GuildMember) {
 *         console.log(member)
 *     }
 * })
 * ```
 */
export enum EventType {
    /**
     * The EventType for handling discord events
     */
    Discord,
    /**
     * The EventType for handling sern events
     */
    Sern,
    /**
     * The EventType for handling external events.
     * Could be for example, `process` events, database events
     */
    External,
}

/**
 * A bitfield that discriminates plugins
 * @enum { number }
 * @example
 * ```ts
 * export default function myPlugin() : EventPlugin<CommandType.Text> {
 *     //highlight-next-line
 *     type : PluginType.Event,
 *     execute([ctx, args], controller) {
 *         return controller.next();
 *     }
 * }
 * ```
 */
export enum PluginType {
    /**
     * The PluginType for InitPlugins
     */
    Init = 1,
    /**
     * The PluginType for EventPlugins
     */
    Control = 2,
}
/**
 * @deprecated - Use strings 'success' | 'failure' | 'warning'
 * @enum { string }
 */
export enum PayloadType {
    Success = 'success',
    Failure = 'failure',
    Warning = 'warning',
}

/**
 * @enum { string }
 */
export const enum SernError {
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
     * Required Dependency not found
     */
    MissingRequired = `@sern/client is required but was not found`,
}
