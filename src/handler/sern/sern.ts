import type { MessagePackage, Visibility } from "../../types/handler/handler";
import { CommandType } from "../../types/handler/handler";
import { Files } from "../utils/readFile"
import type { Awaitable, Client, CommandInteraction, Message, Util } from "discord.js";
import type { possibleOutput } from "../../types/handler/handler"
import { Err, Ok, Result, Option, None, Some } from "ts-results";
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
                    await Files.registerModules(this);
                    
                    
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

                .on("interactionCreate", async interaction => {
                    if (!interaction.isCommand()) return;
                    const module = Files.Slash.get(interaction.commandName);
                    await this.interactionResult(module);    
                    
                })
            }

            private async interactionResult(module: Sern.Module<unknown> | undefined) {

            }

            private async commandResult(module: Sern.Module<unknown> | undefined, message: Message) : Promise<possibleOutput| undefined> {
                if (module === undefined) return "Unknown Command";
                if (module.visibility === "private" && message.guildId !== this.privateServerId) {
                    return "This command is not availible in this guild!"
                }
                if (module.type === CommandType.SLASH) return `This may be a slash command and not a legacy command`
                    let args = this.msgHandler.fmtMsg.join(" ");
                    let parsedArgs = module.parse === undefined ? Ok("") : module.parse(message, args);
                if(parsedArgs.err) return parsedArgs.val;
                    let fn = await module.delegate({interaction : None, message: Some(message)}, parsedArgs)
                return fn instanceof Object ? fn.val : undefined 
            }

            get prefix() : string {
                return this.wrapper.prefix;
            }
            get commandDir() : string {
                return this.wrapper.commands;
            }
            get client() : Client<boolean> {
                return this.wrapper.client
            }
            get privateServerId() {
                return this.wrapper.privateServerId;
            }
        
        
    }
    /**
     * An object to be passed into Sern.Handler constructor. 
     * ```ts
     * new Sern.Handler({
     *   client,       // Discord.js client instance          
     *   prefix : "!", // an example prefix
     *   commands: "",  //commands directory
     *   init : () => console.log("Bot is ready") // function called on ready
     *   privateServerId : "" // a server id that can be used for private or test server
     * })
     * ```
     */
    export interface Wrapper {
        readonly client : Client,
        readonly prefix: string,
        readonly commands : string
        init? : () => void,
        readonly privateServerId : string
    }

    type Context = {
        message : Option<Message>,
        interaction : Option<CommandInteraction>
    }


    export interface Module<T> { 
        alias: string[],
        desc : string,
        visibility : Visibility,
        type: CommandType,
        delegate : ( eventParams : Context  , args: Ok<T> ) => Awaitable<Result<possibleOutput, string > | void>  
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