/**
 * @enum { number };
 */
enum CommandType {
    Text = 0b00000000001,
    Slash = 0b00000000010,
    MenuUser = 0b00000000100,
    MenuMsg = 0b0000001000,
    Button = 0b00000010000,
    MenuSelect = 0b00000100000,
    Modal = 0b00001000000,
    Autocomplete = 0b00010000000,
    Discord = 0b00100000000,
    External = 0b01000000000,
    Sern = 0b10000000000,
    Both = 0b0000011,
}

enum PluginType {
    Command = 0b01,
    Event = 0b10,
}

export { CommandType, PluginType };
