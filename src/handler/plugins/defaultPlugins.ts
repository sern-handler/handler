import type { Client } from "discord.js";
import type { Module } from "../..";
import { CommandPlugin, Controller, PluginType } from "./plugin";

export function reload(
    data : { guildId: string, applicationId: string }
) : CommandPlugin {
    
    return {
        type : PluginType.Command,
        name : 'Refresh',
        description : 'Will reload the command this plugin is applied to',
        async execute(client : Client, module: Module, controller : Controller ) {
            const curGuild = await client.guilds.fetch(data.guildId);
            await curGuild.commands.edit(data.applicationId, {
                name : module.name!,
                description: module.description,
            })
            return controller.next()
        }
    }
}

