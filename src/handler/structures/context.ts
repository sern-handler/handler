import type {
    Interaction,
    Message,
    Snowflake
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
    static wrap<I extends Interaction = Interaction>(wrappable: I|Message) : Context<I> {
        if ( "token" in wrappable ) {
           return new Context<I>( None, Some(wrappable));
        }
        return new Context<I>(Some(wrappable), None);
    }
    public static empty<T extends Interaction>() : Context<T> {
        return new Context<T>(None, None);
    }
    public isEmpty() {
        return this.msg.none && this.interaction.none;
    }

    public get messageUnchecked()  {
        return this.msg.unwrap();
    }
    public get interactionUnchecked() {
        return this.interac.unwrap();
    }
    private get message() {
       return this.msg; 
    }
    private get interaction() {
       return this.interac;
    }

    /**
    * maps a general Context<I> to Context<B>
    * if interaction is None return Context.empty()
    */

    public map_interaction<B extends Interaction = Interaction>(
        cb : ( ctx: I ) => Context<B>
    ) : Context<B> {
        if (this.interac.none) return Context.empty();
        return cb(this.interactionUnchecked);
    }

    public get id() : Snowflake {
       return firstSome(
        this.interac.andThen( i => Some(i.id)),
        this.msg.andThen(m => Some(m.id))
       )!; 
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
    public get createdTimestamp() : number {
        return firstSome(
         this.message.andThen(m => Some(m.createdTimestamp)),
         this.interaction.andThen(i => Some(i.createdTimestamp))
        )!;
    }
}




