/**
 * @enum { number };
 */
enum CommandType {
    Text = 0b00000001,
    Slash = 0b00000010,
    MenuUser = 0b00000100,
    MenuMsg = 0b00001000,
    Button = 0b00010000,
    MenuSelect = 0b00100000,
    Modal = 0b01000000,
    Autocomplete = 0b10000000,
    Both = 0b0000011,
}

enum PluginType {
    Command = 0b01,
    Event = 0b10,
}

export { CommandType, PluginType };
