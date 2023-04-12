enum DispatchType {
    Websocket,
    Serverless
}


type PlatformStrategy =
    | WebsocketStrategy
    | ServerlessStrategy;

interface WebsocketStrategy {
    type: DispatchType.Websocket;
    interactionCreate: string;
    messageCreate: string;
    ready: string;
    
}

interface ServerlessStrategy {
    type: DispatchType.Serverless;

}
