import type { Arg, Context, MessagePackage, Nullable, ParseType, Visibility } from "../../types/handler/handler";
import { CommandType } from "../../types/handler/handler";
import { Files } from "../utils/readFile"
import type {  ApplicationCommandOptionData, Awaitable, Client, CommandInteraction, CommandInteractionOptionResolver, Message} from "discord.js";
import type { possibleOutput } from "../../types/handler/handler"
import { Err, Ok, Result, Option, None, Some } from "ts-results";
import type { Utils } from "../utils/preprocessors/args";




export namespace Sern {
    export class Handler {
        private wrapper: Sern.Wrapper;
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
                    if (CtxHandler.isBot(message) || !CtxHandler.hasPrefix(message,this.prefix)) return;
                    let tryFmt = CtxHandler.fmt(message, this.prefix)
                    const commandName = tryFmt.shift()!;
                    const module = Files.Commands.get(commandName) ?? Files.Alias.get(commandName)
                    if(module === undefined) {
                        message.channel.send("Unknown legacy command")
                        return;
                    }
                    let cmdResult = (await this.commandResult(module?.mod, message, tryFmt.join(" ")))  
                    if (cmdResult === undefined) return;
                       
                    message.channel.send(cmdResult)

                })

                .on("interactionCreate", async interaction => {
                    if(!interaction.isCommand()) return;
                    const module = Files.Commands.get(interaction.commandName); 
                    let res = await this.interactionResult(module, interaction);
                    if (res === undefined) return;
                    await interaction.reply(res);
                })
            }

            private async interactionResult(
                module: { mod: Sern.Module<unknown>, options: ApplicationCommandOptionData[]} | undefined,
                interaction: CommandInteraction) : Promise<possibleOutput | undefined> {

                if (module === undefined) return "Unknown slash command!";
                const name = Array.from(Files.Commands.keys()).find(it => it === interaction.commandName)!;

                (await this.client.guilds.fetch(this.privateServerId))
                .commands
                .create({
                    name, 
                    description : module.mod.desc,
                    options: module.options
                });

                if(module.mod.type < CommandType.SLASH) return "This is not a slash command";
                    const context = {text: None, slash: Some(interaction)} 
                    const parsedArgs = module.mod.parse?.(context, ["slash", interaction.options ] ) ?? Ok("");
                if(parsedArgs.err) return parsedArgs.val;
                    const fn = await module.mod.delegate(context, parsedArgs);
                return fn?.val;
            }

            private async commandResult(module: Sern.Module<unknown> | undefined, message: Message, args : string) : Promise<possibleOutput| undefined> {
                if (module === undefined) return "Unknown legacy command";
                if (module.visibility === "private" && message.guildId !== this.privateServerId) {
                    return "This command is not availible in this guild!"
                }
                if (module.type === CommandType.SLASH) return `This may be a slash command and not a legacy command`
                    const context = {text: Some(message), slash: None}
                    const parsedArgs = module.parse?.(context, ["text", args] ) ?? Ok("");
                if(parsedArgs.err) return parsedArgs.val;
                    let fn = await module.delegate(context, parsedArgs)
                return fn?.val 
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

    

    export interface Module<T> { 
        alias: string[],
        desc : string,
        visibility : Visibility,
        type: CommandType,
        delegate : ( eventParams : Context  , args: Ok<T> ) => Awaitable<Result<possibleOutput, string > | void>  
        parse? :  (ctx: Context,  args: ParseType<Arg> ) => Utils.ArgType<T> 
    }
    
     
}

class CtxHandler {

    static isBot(message: Message) {
        return message.author.bot;
    }

    static hasPrefix(message: Message, prefix: string) {
        return (message.content.slice(0, prefix.length).toLowerCase().trim()) === prefix;
    } 

    static fmt(msg: Message, prefix: string) : string[]  {
        return msg.content.slice(prefix.length).trim().split(/\s+/g)
    }
}