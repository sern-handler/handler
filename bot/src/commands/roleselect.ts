import { CommandType, commandModule } from "@sern/handler"

export default commandModule( {
    type: CommandType.RoleSelect,
    execute: (s) => {
        s.reply('selected role')
    }

})
