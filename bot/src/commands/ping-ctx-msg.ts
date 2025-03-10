import { CommandType, commandModule } from '@sern/handler'

export default commandModule({ 
    type: CommandType.CtxMsg,
    execute: (i, sdt) => {
        i.reply('pong msg')
    }
})
