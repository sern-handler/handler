import type {
    Interaction,
    Message
} from 'discord.js';
import { None, Option, Some } from 'ts-results';

function firstSome<T>(...args : Option<T>[]) : T | null {
    for ( const op of args ) {
        if (op.some) return op.val;
    }
    return null;
}

export default class Context<I extends Interaction = Interaction> {
    private msg: Option<Message> = None;
    private interac: Option<I> = None;

    constructor(message : Option<Message>, interaction: Option<I> ) {
        this.msg = message;
        this.interac = interaction;
    }

    private get messageUnchecked() {
        return this.msg.unwrap();
    }
    private get interactionUnchecked() {
        return this.interac.unwrap();
    }
    private get message() {
       return this.msg; 
    }
    private get interaction() {
       return this.interac;
    }
     
    public get channel() {
      return firstSome(
          this.message.andThen(m => Some(m.channel)),
          this.interaction.andThen(i => Some(i.channel))
      );
    }
    public get user() {
        return firstSome(
          this.message.andThen(m => Some(m.author)),
          this.interaction.andThen(i => Some(i.user))
      ); 
    }
}

