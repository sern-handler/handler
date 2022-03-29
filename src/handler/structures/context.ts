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

    private constructor(message : Option<Message>, interaction: Option<I> ) {
        this.msg = message;
        this.interac = interaction;
    }
    static wrap<I extends Interaction>(wrappable: I | Message) : Context<I> {
        if ( "token" in wrappable) {
           return new Context( None, Some(wrappable));
        }
        return new Context(Some(wrappable), None)
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

