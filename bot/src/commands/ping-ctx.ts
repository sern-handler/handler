import { CommandType, commandModule } from "@sern/handler";


export default commandModule({ 
    type: CommandType.CtxUser,
    execute: (i, sdt) => {
        i.reply('pong')
    }
})
