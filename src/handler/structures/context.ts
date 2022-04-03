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

    private constructor(
        private oMsg: Option<Message> = None,
        private oInterac: Option<I> = None 
    ) {
        this.oMsg = oMsg;
        this.oInterac = oInterac;
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
        return this.oMsg.none && this.oInterac.none;
    }

    public get message()  {
        return this.oMsg.unwrap();
    }
    public get interaction() {
        return this.oInterac.unwrap();
    }


    /**
    * maps a general Context<I> to Context<B>
    * if interaction is None return Context.empty()
    */

    public map_interaction<B extends Interaction = Interaction>(
        cb : ( ctx: I ) => Context<B>
    ) : Context<B> {
        if (this.oInterac.none) return Context.empty();
        return cb(this.oInterac.val);
    }

    public get id() : Snowflake {
       return firstSome(
        this.oInterac.andThen( i => Some(i.id)),
        this.oMsg.andThen(m => Some(m.id))
       )!; 
    }

    public get channel() {
      return firstSome(
          this.oMsg.andThen(m => Some(m.channel)),
          this.oInterac.andThen(i => Some(i.channel))
      );
    }
    public get user() {
        return firstSome(
          this.oMsg.andThen(m => Some(m.author)),
          this.oInterac.andThen(i => Some(i.user))
      ); 
    }
    public get createdTimestamp() : number {
        return firstSome(
         this.oMsg.andThen(m => Some(m.createdTimestamp)),
         this.oInterac.andThen(i => Some(i.createdTimestamp))
        )!;
    }
}




