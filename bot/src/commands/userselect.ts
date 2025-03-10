import { CommandType, commandModule } from "@sern/handler";

export default commandModule( {
    type: CommandType.UserSelect,
    execute: (s) => {
        s.reply('selected user')
    }
})
