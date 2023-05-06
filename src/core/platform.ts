export const enum DispatchType {
    Websocket,
    Serverless
}

export type PlatformStrategy =
    | WebsocketStrategy
    | ServerlessStrategy;

export interface WebsocketStrategy {
    type: DispatchType.Websocket;
    eventNames: [interactioncreate: string, messagecreate: string, ready: string]
    defaultPrefix?: string;
}

export interface ServerlessStrategy {
    type: DispatchType.Serverless;
}

export function makeWebsocketAdapter(
    eventNames: [interactioncreate: string, messagecreate: string, ready: string],
    defaultPrefix?: string
): WebsocketStrategy {
    return {
        type: DispatchType.Websocket,
        eventNames,
        defaultPrefix
    };
}

export function makeServerlessAdapter(): ServerlessStrategy {
    return {
        type: DispatchType.Serverless,
    };
}

export const discordjs = ( defaultPrefix?: string ) => makeWebsocketAdapter(
    ['interactionCreate', 'messageCreate', 'ready'],
    defaultPrefix
)
