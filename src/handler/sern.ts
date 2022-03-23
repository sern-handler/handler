import type {
    DiscordEvent,
} from '../types/handler';

import type {
    Client,
} from 'discord.js';

import type Wrapper from './structures/wrapper';
import { fromEvent } from 'rxjs';
import { SernError } from './structures/errors';
import { onReady } from './events/readyEvent';
import { onMessageCreate } from './events/messageEvent';
import { onInteractionCreate } from './events/interactionCreate';

export function init( wrapper : Wrapper ) {
   const { events, client } = wrapper; 
   if (events !== undefined) eventObserver(client, events);
   onReady( wrapper );
   onMessageCreate( wrapper );
   onInteractionCreate ( wrapper ); 

   
}

function eventObserver(client: Client, events: DiscordEvent[] ) {
  events.forEach( ( [event, cb] ) => {
      if (event === 'ready') throw Error(SernError.RESERVED_EVENT);
      fromEvent(client, event, cb).subscribe();
  });
}

export class Handler { 
/**           
            .on('messageCreate', async (message: Message) => {
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
        const context = new Context ( Some(message), None );
        const args = message.content.slice(this.prefix.length).trim().split(/s+/g);
        const parsedArgs = module.mod.parse?.(context, ['text', args]) ?? Ok(args);
        if (parsedArgs.err) return parsedArgs.val;
        return (module.mod.execute?.(context, parsedArgs) as possibleOutput | undefined);
    };
*/    

}  

/**
 * @enum { number };
 */
export enum CommandType {
    TEXT  = 0b0001,
    SLASH = 0b0010,
    BOTH  = 0b0011
}
