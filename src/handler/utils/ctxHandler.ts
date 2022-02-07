import type { Message } from "discord.js";

export class CtxHandler {

    static isBot(message: Message) {
        return message.author.bot;
    }

    static hasPrefix(message: Message, prefix: string) {
        return (message.content.slice(0, prefix.length).toLowerCase().trim()) === prefix;
    } 

    static fmt(msg: Message, prefix: string) : string[]  {
        return msg.content.slice(prefix.length).trim().split(/\s+/g)
    }
}