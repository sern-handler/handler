/**
 * @enum { number };
 */
export enum CommandType {
    Text = 0b00000000001,
    Slash = 0b00000000010,
    Both = 0b0000011,
    MenuUser = 0b00000000100,
    MenuMsg = 0b0000001000,
    Button = 0b00000010000,
    MenuSelect = 0b00000100000,
    Modal = 0b00001000000,
}

export enum EventType {
    Discord = 0b01,
    Sern = 0b10,
    External = 0b11,
}

export enum PluginType {
    Command = 0b01,
    Event = 0b10,
}

export enum PayloadType {
    Success = 'success',
    Failure = 'failure',
    Warning = 'warning',
}
