import type { MessagePackage, Visibility } from "../../types/handler/handler";
import { CommandType } from "../../types/handler/handler";
import { Files } from "../utils/readFile"
import type { Awaitable, Client, Message, Util } from "discord.js";
import type { possibleOutput } from "../../types/handler/handler"
import { Err, Ok, Result } from "ts-results";
import type { Utils } from "../utils/preprocessors/args";



export namespace Sern {
    
    export class Handler {
        private wrapper: Sern.Wrapper;
        private msgHandler : MsgHandler = new MsgHandler();
        constructor(
            wrapper : Sern.Wrapper,
            ) {
             this.wrapper = wrapper;
             this.wrapper.client
                .on("ready", async () => {
                    if (this.wrapper.init !== undefined) this.wrapper.init();
                    await Files.registerModules(this.wrapper.commands);
                })

                .on("messageCreate", async message => {
                    let tryFmt = this.msgHandler.listen({message, prefix: this.prefix}).fmt();
                    if (tryFmt.err) return;
                    const commandName = this.msgHandler.fmtMsg!.shift()!;
                    const module = Files.Commands.get(commandName) ?? Files.Alias.get(commandName)
                    let cmdResult = (await this.commandResult(module, message))  
                    if (cmdResult === undefined) return;
                       
                    message.channel.send(cmdResult)
                })
            }

            private async commandResult(module: Sern.Module<unknown> | undefined, message: Message) : Promise<possibleOutput| undefined> {
                if (module === undefined) return "Unknown Command";
                if (module.visibility === "private" && message.guildId !== this.privateServerId) {
                    return "This command is not availible in this guild!"
                }
                if (module.type === CommandType.SLASH) return `This may be a slash command and not a legacy command`
                    let args = this.msgHandler.fmtMsg.slice(1).join(" ");
                    let parsedArgs = module.parse === undefined ? Ok("") : module.parse(message, args);
                if(parsedArgs.err) return parsedArgs.val;
                    let fn = await module.delegate(message, parsedArgs)
                return fn instanceof Object ? fn.val : undefined 
            }

            get prefix() {
                return this.wrapper.prefix;
            }

            private get privateServerId() {
                return this.wrapper.privateServerId;
            }
        
        
    }

    export interface Wrapper {
        client : Client,
        prefix: string,
        commands : string
        init? : () => void,
        privateServerId : string
    }

    export interface Module<T> { 
        alias: string[],
        desc : string,
        visibility : Visibility,
        type: CommandType,
        delegate : (message: Message, args: Ok<T> ) => Awaitable<Result<possibleOutput, string > | void>  
        parse? : (message: Message, args: string) => Utils.ArgType<T>
    }

     
}

class MsgHandler {

    private msg : MessagePackage | null = null;
    private resMsg : string[] | null =  null;

    listen (msg : MessagePackage): MsgHandler  {
        this.msg = msg
        return this;
    }

    isCommand() : boolean {
        const msg = this.msg!.message.content.trim()
        return this.message.author.bot || msg.slice(0, this.prefix.length).toLowerCase() !== this.prefix;
    }

    fmt() : Result<void, void> {
        if (this.isCommand()) return Err(void 0);
        this.resMsg = this.message.content.slice(this.prefix.length).trim().split(/\s+/g);
        return Ok(void 0);
    }

    get fmtMsg() {
        return this.resMsg!;
    }

    get messagePack() {
        return this.msg;
    }
    
    get message() {
        return this.msg!.message
    }
    
    get prefix() {
        return this.msg!.prefix
    }

}