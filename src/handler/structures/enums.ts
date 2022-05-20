/**
 * @enum { number };
 */
enum CommandType {
    Text = 0b0000001,
    Slash = 0b0000010,
    MenuUser = 0b0000100,
    MenuMsg = 0b0001000,
    Button = 0b0010000,
    MenuSelect = 0b0100000,
    Both = 0b0000011,
}

enum PluginType {
    Command = 0b01,
    Event = 0b10,
}

export { CommandType, PluginType };
