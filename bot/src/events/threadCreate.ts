import { discordEvent } from "@sern/handler";

export default discordEvent({
    name: 'threadCreate',
    execute(thread)  {
        console.log(thread)
    }
})
