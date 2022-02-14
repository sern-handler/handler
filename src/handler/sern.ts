import * as Files from './utilities/readFile';
import type * as Utils from './utilities/preprocessors/args';

import type {
  Arg,
  Context,
  Visibility,
  possibleOutput
} from '../types/handler';

import type {
  ApplicationCommandOptionData,
  Awaitable,
  Client,
  CommandInteraction,
  Message
} from 'discord.js';

import { Ok, Result, None, Some } from 'ts-results';
import { isBot, hasPrefix, fmt } from './utilities/messageHelpers';

/**
 * @class
 */

export class Handler {
    private wrapper: Wrapper;

    /**
     * @constructor
     * @param {Wrapper} wrapper The data that is required to run sern handler 
     */
    
    constructor(
        wrapper: Wrapper,
    ) {
        this.wrapper = wrapper;
        this.client
            
            /**
             * On ready, builds command data and registers them all
             * from command directory 
             **/
            
            .on('ready', async () => {
                Files.buildData(this)
                    .then(data => this.registerModules(data));
                if (wrapper.init !== undefined) wrapper.init(this);
            })

            .on('messageCreate', async (message: Message) => {
                if (isBot(message) || !hasPrefix(message, this.prefix)) return;
                if (message.channel.type === 'DM') return; // TODO: Handle dms

                const tryFmt = fmt(message, this.prefix);
                const module = this.findCommand(tryFmt.shift()!);
                if (module === undefined) {
                    message.channel.send('Unknown legacy command');
                    return;
                }
                const cmdResult = (await this.commandResult(module, message, tryFmt.join(' ')));
                if (cmdResult === undefined) return;

                message.channel.send(cmdResult);

            })

            .on('interactionCreate', async (interaction) => {
                if (!interaction.isCommand()) return;
                const module = Files.Commands.get(interaction.commandName);
                const res = await this.interactionResult(module, interaction);
                if (res === undefined) return;
                await interaction.reply(res);
            });
    }

    /**
     * 
     * @param {Files.CommandVal | undefined} module Command file information 
     * @param {CommandInteraction} interaction The Discord.js command interaction (DiscordJS#CommandInteraction)) 
     * @returns {possibleOutput | undefined} Takes return value and replies it, if possible input
     */
    
    private async interactionResult(
        module: Files.CommandVal | undefined,
        interaction: CommandInteraction): Promise<possibleOutput | undefined> {

        if (module === undefined) return 'Unknown slash command!';
        const name = this.findCommand(interaction.commandName);
        if (name === undefined) `${interaction.commandName} is not a valid command!`;
        if (module.mod.type < CommandType.SLASH) return 'This is not a slash command';
        
        const context = { message: None, interaction: Some(interaction) };
        const parsedArgs = module.mod.parse?.(context, ['slash', interaction.options]) ?? Ok('');
        
        if (parsedArgs.err) return parsedArgs.val;
        
        return (await module.mod.delegate(context, parsedArgs))?.val;
    }

    /**
     * 
     * @param {Files.CommandVal | undefined} module Command file information
     * @param {Message} message The message object
     * @param {string} args Anything after the command 
     * @returns Takes return value and replies it, if possible input
     */
    
    private async commandResult(module: Files.CommandVal | undefined, message: Message, args: string): Promise<possibleOutput | undefined> {
        if (module?.mod === undefined) return 'Unknown legacy command';
        if (module.mod.type === CommandType.SLASH) return `This may be a slash command and not a legacy command`;
        if (module.mod.visibility === 'private') {
            const checkIsTestServer = this.privateServers.find(({ id }) => id === message.guildId!)?.test;
            if (checkIsTestServer === undefined) return 'This command has the private modifier but is not registered under Handler#privateServers';
            if (checkIsTestServer !== module.mod.test) {
              const msg = `This command is only available on test servers.`; // TODO: Customizable private message  
              
              return msg;
            }
        }
        const context = {
            message: Some(message),
            interaction: None
        };
        const parsedArgs = module.mod.parse?.(context, ['text', args]) ?? Ok('');
        if (parsedArgs.err) return parsedArgs.val;
        return (await module.mod.delegate(context, parsedArgs))?.val;
    }
    
    /**
     * This function chains `Files.buildData`
     * @param {{name: string, mod: Module<unknown>, absPath: string}} modArr module information
     */

    private async registerModules(
        modArr: {
            name: string,
            mod: Module<unknown>,
            absPath: string
        }[]
    ) {
        for await (const { name, mod, absPath } of modArr) {
            const cmdName = Files.fmtFileName(name);
            switch (mod.type) {
                case 1: Files.Commands.set(cmdName, { mod, options: []  }); break;
                case 2:
                case (1 | 2): {
                    const options = ((await import(absPath)).options as ApplicationCommandOptionData[]);
                    Files.Commands.set(cmdName, { mod, options: options ?? [] });
                    switch (mod.visibility) {
                        case 'private': {
                            // Reloading guild slash commands
                           await this.reloadSlash(cmdName, mod.desc, options);
                        }
                        case 'public': {
                            // Creating global commands
                            // TODO : warn user they will be creating a public command
                            await this.client.application!.commands
                                .create({
                                    name: cmdName,
                                    description: mod.desc,
                                    options
                                });
                        }
                    }
                } break;
                default: throw Error(`SernHandlerError: ${name} with ${mod.visibility} is not a valid module type.`);
            }

            if (mod.alias.length > 0) {
                for (const alias of mod.alias) {
                    Files.Alias.set(alias, { mod, options: [] });
                }
            }
        }
    }
    /**
     * 
     * @param {string} name name of possible command
     * @returns {Files.CommandVal | undefined}
     */
    private findCommand(name : string) : Files.CommandVal | undefined {
        return Files.Commands.get(name) ?? Files.Alias.get(name);
    }

    /**
     * 
     * @param {string} cmdName name of command
     * @param {string} description description of command 
     * @param {ApplicationCommandOptionData[]} options any options for the slash command 
     */
    
    private async reloadSlash(
        cmdName: string,
        description: string,
        options: ApplicationCommandOptionData[]
    ) : Promise<void> {
        for (const { id } of this.privateServers) {
            const guild = (await this.client.guilds.fetch(id));

            guild.commands.create({
                name: cmdName,
                description,
                options
            });
        }
    }

    /**
     * @readonly
     * @returns {string} The prefix used for legacy commands
     */
    
    get prefix(): string {
        return this.wrapper.prefix;
    }
    
    /**
    * @readonly
    * @returns {string} Directory of the commands folder
    */
    
    get commandDir(): string {
        return this.wrapper.commands;
    }

    /**
     * @readonly
     * @returns {Client<boolean>} the discord.js client (DiscordJS#Client));
     */
    
    get client(): Client<boolean> {
        return this.wrapper.client;
    }
    
    /**
     * @readonly
     * @returns {{test: boolean, id: string}[]} Private server ID for testing or personal use
     */
    
    get privateServers(): { test: boolean, id: string }[] {
        return this.wrapper.privateServers;
    }
}

/**
 * An object to be passed into Sern.Handler constructor. 
 * @typedef {object} Wrapper
 * @property {readonly Client} client
 * @property {readonly string} prefix
 * @property {readonly string} commands
 * @prop {(handler : Handler) => void)} init
 * @property {readonly {test: boolean, id: string}[]} privateServers
 */
export interface Wrapper {
    readonly client: Client,
    readonly prefix: string,
    readonly commands: string
    init?: (handler: Handler) => void,
    readonly privateServers: { test: boolean, id: string }[],
}

/**
 * An object that gets imported and acts as a command. 
 * @typedef {object} Module<T=string>
 * @property {string} desc
 * @property {Visibility} visibility
 * @property {CommandType} type
 * @property {(eventParams : Context, args : Ok<T=string>) => Awaitable<Result<possibleOutput, string> | void>)} delegate
 * @prop {(ctx: Context, args: Arg) => Utils.ArgType<T>} parse
 */

export interface Module<T = string> {
    alias: string[],
    desc: string,
    visibility: Visibility,
    type: CommandType,
    test : boolean,
    delegate: (eventParams: Context, args: Ok<T>) => Awaitable<Result<possibleOutput, string> | void>
    parse?: (ctx: Context, args: Arg) => Utils.ArgType<T>
}

/**
 * @enum { number };
 */

export enum CommandType {
  TEXT = 1,
  SLASH = 2,
}
