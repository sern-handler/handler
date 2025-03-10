/**
 * This plugin checks if a channel is the specified type
 *
 * @author @Benzo-Fury [<@762918086349029386>]
 * @version 1.0.0
 * @example
 * ```ts
 * import { channelType } from "../plugins/channelType";
 * import { ChannelType } from "discord.js"
 * import { commandModule } from "@sern/handler";
 * export default commandModule({
 *  plugins: [ channelType([ChannelType.GuildText], 'This cannot be used here') ],
 *  execute: (ctx) => {
 * 		//your code here
 *  }
 * })
 * ```
 */
import { ChannelType } from "discord.js";
import {CommandControlPlugin, CommandType, controller } from "@sern/handler";
export function channelType(
    channelType: ChannelType[],
    onFail?: string
){
    return CommandControlPlugin<CommandType.Both>(async (ctx) => {
        let channel = ctx.channel?.type;
        //for some reason the dm channel type was returning undefined at some points
        if (channel === undefined) {
            channel = ChannelType.DM;
        }
        if (channelType.includes(channel)) {
            return controller.next();
        }
        if (onFail) {
            await ctx.reply(onFail);
        }
        return controller.stop();
    })
}
