import { EventType, eventModule } from "@sern/handler";


export default eventModule({ 
    name: 'error',
    type: EventType.Sern,
    execute: (e) => {
        console.log(e)
    }
})
