import * as Files from './utilities/readFile';
import type {
    DiscordEvent,
    possibleOutput,
} from '../types/handler';

import type {
    ApplicationCommandOptionData,
    Client,
    CommandInteraction,
    Message
} from 'discord.js';

import { Ok, None, Some } from 'ts-results';
import { isNotFromBot, hasPrefix, fmt } from './utilities/messageHelpers';
import Logger, { sEvent } from './logger';
import { AllTrue } from './utilities/higherOrders';
import type Module from './structures/module';
import Context from './structures/context';
import type Wrapper from './structures/wrapper';
import { fromEvent } from 'rxjs';
import { SernError } from './structures/errors';
import { onReady } from './events/readyEvent';

export function init( wrapper : Wrapper) {
   const { events, client } = wrapper; 
   if (events !== undefined) eventObserver(client, events);
   onReady(wrapper);  
}

function eventObserver(client: Client, events: DiscordEvent[] ) {
  events.forEach( ( [event, cb] ) => {
      if (event === 'ready') throw Error(SernError.RESERVED_EVENT);
      fromEvent(client, event, cb).subscribe();
  });
}

export class Handler { 
    private wrapper: Wrapper;
    private defaultLogger: Logger = new Logger();
    /**
     *
     * @constructor
     * @param {Wrapper} wrapper The data that is required to run sern handler
     */
    constructor(wrapper: Wrapper) { 
        this.wrapper = wrapper;
        this.client

           
           
            .on('messageCreate', async (message: Message) => {
                const isExecutable = AllTrue(isNotFromBot, hasPrefix);
                if (!isExecutable(message, this.prefix)) return;
                if (message.channel.type === 'DM') return; // TODO: Handle dms
                const module = this.findModuleFrom(message);
                if (module === undefined) {
                    this.defaultLogger.log(
                        sEvent.MISUSE_CMD,
                        message.guildId!,
                        `Unknown legacy command.`
                    );
                    return;
                }
                const cmdResult = await this.commandResult(module, message);
                if (cmdResult === undefined) return;

                message.channel.send(cmdResult);
            })

            .on('interactionCreate', async (interaction) => {
                if (!interaction.isCommand()) return;
                if (interaction.guild === null) return; // TODO : handle dms
                const module = this.findModuleFrom(interaction);
                if (module === undefined) {
                    this.defaultLogger.log(
                        sEvent.MISUSE_CMD,
                        interaction.guildId!,
                        `Unknown slash command.`
                    );
                    return;
                }
                const res = await this.interactionResult(module, interaction);
                if (res === undefined) return;
                await interaction.reply(res);
            });
    }

    /**
     *
     * @param {Files.CommandVal} module Command file information
     * @param {CommandInteraction} interaction The Discord.js command interaction (DiscordJS#CommandInteraction))
     * @returns {possibleOutput | undefined} Takes return value and replies it, if possible input
     */

    private async interactionResult(
        module: Files.CommandVal,
        interaction: CommandInteraction,
    ): Promise<possibleOutput | undefined> {
        const name = this.findModuleFrom(interaction);
        if (name === undefined) return `Could not find ${interaction.commandName} command!`;

        if (module.mod.type < CommandType.SLASH) return 'This is not a slash command';
        const context = new Context(None, Some(interaction));
        const parsedArgs = module.mod.parse?.(context, ['slash', interaction.options]) ?? Ok('');

        if (parsedArgs.err) return parsedArgs.val;

        return (module.mod.execute?.(context, parsedArgs) as possibleOutput | undefined);
    }

    /**
     *
     * @param {Files.CommandVal} module Command file information
     * @param {Message} message The message object
     * @param {string} args Anything after the command
     * @returns Takes return value and replies it, if possible input
     */

    private async commandResult(
        module: Files.CommandVal,
        message: Message,
    ): Promise<possibleOutput | undefined> {
        if (module.mod.type === CommandType.SLASH) {
            this.defaultLogger.log(
                sEvent.MISUSE_CMD,
                message.guildId!,
                `The text command ${module.mod.name} may be a slash command and not a text command`
            );
            return;
        }
        if (module.mod.visibility === 'private') {
            const checkIsTestServer = this.privateServers.find(({ id }) => id === message.guildId!)?.test;
            if (checkIsTestServer === undefined) {
                this.defaultLogger.log(
                    sEvent.MISUSE_CMD,
                    message.guildId!,
                    `The text command ${module.mod.name} has private modifier but is not registered in private server config.`
                );
                return;
            }
            if (checkIsTestServer !== module.mod.test) {
                this.defaultLogger.log(
                    sEvent.MISUSE_CMD,
                    message.guildId!,
                    `The command ${module.mod.name} is only available on test servers.`
                );
                return;
            }
        }
        const context = new Context ( Some(message), None );
        const args = message.content.slice(this.prefix.length).trim().split(/s+/g);
        const parsedArgs = module.mod.parse?.(context, ['text', args]) ?? Ok(args);
        if (parsedArgs.err) return parsedArgs.val;
        return (module.mod.execute?.(context, parsedArgs) as possibleOutput | undefined);
    }

    /**
     * This function chains `Files.buildData`
     * @param {{name: string, mod: Module<unknown>, absPath: string}} modArr module information
     */

    private async registerModules(
        modArr: {
            name: string;
            mod: Module<unknown>;
            absPath: string;
        }[],
    ) {
        for await (const { name, mod, absPath } of modArr) {
            const cmdName = Files.fmtFileName(name);
            switch (mod.type) {
                case 1:
                    Files.Commands.set(cmdName, { mod: { name: cmdName, ...mod }, options: [] });
                    break;
                case 2:
                case 1 | 2:
                    {
                        const options = (await import(absPath)).options as ApplicationCommandOptionData[];
                        Files.Commands.set(cmdName, { mod: { name: cmdName, ...mod }, options: options ?? [] });
                        switch (mod.visibility) {
                            case 'private': {
                                // Reloading guild slash commands
                                await this.reloadSlash(cmdName, mod.desc, options);
                            }
                            case 'public': {
                                // Creating global commands
                                await this.client.application!.commands.create({
                                    name: cmdName,
                                    description: mod.desc,
                                    options,
                                });
                            }
                        }
                    }
                    break;
                default:
                    throw Error(`SernHandlerError: ${name} with ${mod.visibility} is not a valid module type.`);
            }

            if (mod.alias.length > 0) {
                for (const alias of mod.alias) {
                    Files.Alias.set(alias, { mod: { name: cmdName, ...mod }, options: [] });
                }
            }
        }
    }

    /**
     * 
     * @param {T extends Message | CommandInteraction} ctx name of possible command
     * @returns {Files.CommandVal | undefined}
     */

    private findModuleFrom<T extends Message | CommandInteraction>(ctx: T): Files.CommandVal | undefined {
        const name = ctx.applicationId === null ? fmt(ctx as Message, this.prefix).shift()! : (ctx as CommandInteraction).commandName;
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
        options: ApplicationCommandOptionData[],
    ): Promise<void> {
        for (const { id } of this.privateServers) {
            const guild = await this.client.guilds.fetch(id);
            guild.commands.create({
                name: cmdName,
                description,
                options,
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

    get privateServers(): { test: boolean; id: string }[] {
        return this.wrapper.privateServers;
    }
}


/**
 * @enum { number };
 */

export enum CommandType {
    TEXT = 1,
    SLASH = 2,
}
