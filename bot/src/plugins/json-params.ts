import { CommandControlPlugin, CommandType, controller } from "@sern/handler";

export const json = CommandControlPlugin<CommandType.Button>((ctx, args) => { 
    return controller.next({ 'json/data': JSON.parse(args.params!) });
})
