import { discordEvent } from "@sern/handler";

const execute = (...args: any[]) => {
    console.log(args[0].content)
}
export default discordEvent({
    name: 'messageCreate',
    once: true,
    execute
})
