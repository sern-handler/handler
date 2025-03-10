import { CommandType, commandModule } from "@sern/handler"; 
import { json } from "../plugins/json-params.js";

export default commandModule({ 
    type: CommandType.Button,
    plugins: [json],
    execute(ctx, args) {
        console.log(args.state['json/data'])
        //@ts-ignore
        ctx.reply(args.state['json/data'].uid)
    }


})
