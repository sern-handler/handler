import type { Arg, Context,  Nullable, ParseType, Visibility } from "../types/handler/handler";
import { Files } from "./utils/readFile"
import type {  ApplicationCommandOptionData, Awaitable, Client, CommandInteraction, CommandInteractionOptionResolver, Message} from "discord.js";
import type { possibleOutput } from "../types/handler/handler"
import { Ok, Result, None, Some } from "ts-results";
import type { Utils } from "./utils/preprocessors/args";
import { CtxHandler } from "./utils/ctxHandler";

export namespace Sern {
    export class Handler {
        private wrapper: Sern.Wrapper;
        constructor(
            wrapper : Sern.Wrapper,
            ) {
             this.wrapper = wrapper;
             this.wrapper.client
                .on("ready", async () => {
                    if (this.wrapper.init !== undefined) this.wrapper.init(this);
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
        init? : (handler : Sern.Handler) => void,
        readonly privateServerId : string
    }
    /**
     * Module Interfaces. Will be used to configure commands across folders
     * Name of command is taken from filename itself.
     * Example command in `ping.ts`
     *```ts
     * export default {
     *   alias : string[],  // any other names the command would be            
     *   desc : string,     // description of command
     *   visibility: "public" | "private", 
     *   //main command that gets executed 
     *   delegate : ( eventParams : Context  , args: Ok<T> ) => Awaitable<Result<possibleOutput, string > | void>,
     *   //if command has arguments needing parsing, this exists
     *   parse?: (ctx: Context,  args: ParseType<Arg> ) => Utils.ArgType<T> 
     * } as Sern.Module
     * ```
     */
    export interface Module<T = string> { 
        alias: string[],
        desc : string,
        visibility : Visibility,
        type: CommandType,
        delegate : ( eventParams : Context  , args: Ok<T> ) => Awaitable<Result<possibleOutput, string > | void>  
        parse? :  (ctx: Context,  args: ParseType<Arg> ) => Utils.ArgType<T> 
    }
    /**
     * Text = 1
     * Slash = 2
     * If a command is both, ( 1 | 2 ), enum value is 3
     */
    export enum CommandType {
        TEXT  = 1,
        SLASH = 2,
    }
     
}

