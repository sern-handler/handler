/**
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
    /**
     * The CommandType for text commands
     */
    Text = 1,
    /**
     * The CommandType for slash commands
     */
    Slash = 2,
    /**
     * The CommandType for hybrid commands, text and slash
     */
    Both = 3,
    /**
     * The CommandType for UserContextMenuInteraction commands
     */
    CtxUser = 4,
    /**
     * The CommandType for MessageContextMenuInteraction commands
     */
    CtxMsg = 8,
    /**
     * The CommandType for ButtonInteraction commands
     */
    Button = 16,
    /**
     * The CommandType for StringSelectMenuInteraction commands
     */
    StringSelect = 32,
    /**
     * The CommandType for ModalSubmitInteraction commands
     */
    Modal = 64,
    /**
     * The CommandType for the other SelectMenuInteractions
     */
    ChannelSelect = 256,
    MentionableSelect = 512,
    RoleSelect= 1024,
    UserSelect= 2048
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
     * The PluginType for CommandPlugins
     */
    Command = 1,
    /**
     * The PluginType for EventPlugins
     */
    Event = 2,
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
