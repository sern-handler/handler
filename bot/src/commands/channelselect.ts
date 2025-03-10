import { CommandType, commandModule } from "@sern/handler";

export default commandModule({ 
    type: CommandType.ChannelSelect,
    execute: (s) => {
        s.reply('clicked channel');
    }

});
