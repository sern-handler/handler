export const enum DispatchType {
    Websocket,
    Serverless
}

export type PlatformStrategy =
    | WebsocketStrategy
    | ServerlessStrategy;

export interface WebsocketStrategy {
    type: DispatchType.Websocket;
    //icreate, messageCreate, ready
    eventNames: [ string, string, string]
    defaultPrefix?: string;
}

export interface ServerlessStrategy {
    type: DispatchType.Serverless;
    endpoint: string;
}

export function makeWebsocketAdapter(
    eventNames: [interactionCreate: string, messageCreate: string, ready: string],
    defaultPrefix?: string
): WebsocketStrategy {
    return {
        type: DispatchType.Websocket,
        eventNames,
        defaultPrefix
    };
}

export function makeServerlessAdapter(i : { endpoint: string }): ServerlessStrategy {
    return {
        type: DispatchType.Serverless ,
        ...i
    };
}
