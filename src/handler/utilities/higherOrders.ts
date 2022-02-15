import type { Message } from "discord.js";

type MsgFnArgs = [msgOrInter: Message, prefix?: string];
type MsgFn = (...args: MsgFnArgs) => boolean;

export function AllTrue(...fn : MsgFn[]) {
    return (message: Message, prefix: string) => {
        return fn.every(f => f(message, prefix) === true)
    }
}

