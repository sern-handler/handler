import { CommandType, EventType, Service, eventModule } from "@sern/handler";


export default eventModule({
    type: EventType.Sern,
    execute: async () => {
        console.log('eventmodule: all loaded');
    }
})
