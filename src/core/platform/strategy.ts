
export const enum DispatchType {
    Websocket,
    Serverless
}

export type PlatformStrategy =
    | WebsocketStrategy
    | ServerlessStrategy;

export interface WebsocketStrategy {
    type: DispatchType.Websocket;
    interactionCreate: string;
    messageCreate: string;
    ready: string;
    defaultPrefix?: string;
}

export interface ServerlessStrategy {
    type: DispatchType.Serverless;
    endpoint: string;
}
