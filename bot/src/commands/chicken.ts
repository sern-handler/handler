import { CommandType, commandModule } from "@sern/handler";
import { publishConfig } from "@sern/publisher";
import { PermissionFlagsBits } from "discord.js";

export default commandModule({
    type: CommandType.Slash,
    plugins: [
        publishConfig({ 
            integrationTypes: ['User'],
            contexts: [0,1,2],
            defaultMemberPermissions: 
                PermissionFlagsBits.Speak
                | PermissionFlagsBits.Connect 
                | PermissionFlagsBits.BanMembers
                

            
        })
    ],
    description: "yo",
    execute:(ctx) => {
        ctx.reply("hello");
    }

})
