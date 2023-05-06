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
    ChannelSelect = 1 << 7,
    MentionableSelect = 1 << 8,
    RoleSelect = 1 << 9,
    UserSelect = 1 << 10,
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
    Discord = 1,
    /**
     * The EventType for handling sern events
     */
    Sern = 2,
    /**
     * The EventType for handling external events.
     * Could be for example, `process` events, database events
     */
    External = 3,
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
 * @enum { string }
 */
export enum PayloadType {
    /**
     * The PayloadType for a SernEmitter success event
     */
    Success = 'success',
    /**
     * The PayloadType for a SernEmitter failure event
     */
    Failure = 'failure',
    /**
     * The PayloadType for a SernEmitter warning event
     */
    Warning = 'warning',
}
