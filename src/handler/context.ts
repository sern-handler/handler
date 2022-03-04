import type {
    CommandInteraction,
    Message
} from 'discord.js';
import { None, Option } from 'ts-results';

export class Context {
    private msg: Option<Message> = None;
    private interac: Option<CommandInteraction> = None;

    constructor(message : Option<Message>, interaction: Option<CommandInteraction> ) {
        this.msg = message;
        this.interac = interaction
    }
    get messageUnchecked() {
        return this.msg.unwrap();
    }
    get interactionUnchecked() {
        return this.interac.unwrap();
    }
    get message() {
       return this.msg; 
    }
    get interaction() {
       return this.interac;
    }
}
