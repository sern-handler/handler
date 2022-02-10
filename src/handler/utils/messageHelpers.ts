import type { Message } from "discord.js";


export function isBot(message: Message) {
    return message.author.bot;
}

export function hasPrefix(message: Message, prefix: string) {
    return (message.content.slice(0, prefix.length).toLowerCase().trim()) === prefix;
}

export function fmt(msg: Message, prefix: string): string[] {
    return msg.content.slice(prefix.length).trim().split(/\s+/g)
}