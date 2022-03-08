import type {
    Interaction,
    Message
} from 'discord.js';
import { None, Option } from 'ts-results';

export default class Context {
    private msg: Option<Message> = None;
    private interac: Option<Interaction> = None;

    constructor(message : Option<Message>, interaction: Option<Interaction> ) {
        this.msg = message;
        this.interac = interaction;
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

