/**
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
    Text = 0b00000000001,
    /**
     * The CommandType for slash commands
     */
    Slash = 0b00000000010,
    /**
     * The CommandType for hybrid commands, text and slash
     */
    Both = 0b0000011,
    /**
     * The CommandType for UserContextMenuInteraction commands
     */
    MenuUser = 0b00000000100,
    /**
     * The CommandType for MessageContextMenuInteraction commands
     */
    MenuMsg = 0b0000001000,
    /**
     * The CommandType for ButtonInteraction commands
     */
    Button = 0b00000010000,
    /**
     * The CommandType for SelectMenuInteraction commands
     */
    MenuSelect = 0b00000100000,
    /**
     * The CommandType for ModalSubmitInteraction commands
     */
    Modal = 0b00001000000,
}

/**
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
    Discord = 0b01,
    /**
     * The EventType for handling sern events
     */
    Sern = 0b10,
    /**
     * The EventType for handling external events.
     * Could be for example, `process` events, database events
     */
    External = 0b11,
}

/**
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
    Command = 0b01,
    /**
     * The PluginType for EventPlugins
     */
    Event = 0b10,
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
