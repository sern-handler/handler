import type { APIInteractionGuildMember } from 'discord-api-types/v9';
import type {
    Awaitable,
    Guild,
    GuildMember,
    Interaction,
    Message,
    Snowflake,
    TextBasedChannel,
    User
} from 'discord.js';
import { None, Option, Some } from 'ts-results';
import type { Nullish } from '../../types/handler';

function firstSome<T>(...args : Option<T>[]) : Nullish<T> {
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

    public mapInteraction<B extends Interaction = Interaction>(
        cb : ( ctx: I ) => Context<B>
    ) : Context<B> {
        if (this.oInterac.none) return new Context();
        return cb(this.oInterac.val);
    }

    public get id() : Snowflake {
       return firstSome(
        this.oInterac.map( i => i.id),
        this.oMsg.map(m => m.id)
       )!; 
    }
    public get channel() : Nullish<TextBasedChannel>  {
      return firstSome(
          this.oMsg.map(m => m.channel),
          this.oInterac.map(i => i.channel)
      );
    }
    public get user(): Nullish<User> {
        return firstSome(
          this.oMsg.map(m => m.author),
          this.oInterac.map(i => i.user)
      ); 
    }
    public get createdTimestamp() : number {
        return firstSome(
         this.oMsg.map(m => m.createdTimestamp),
         this.oInterac.map(i => i.createdTimestamp)
        )!;
    }

    public get guild() : Nullish<Guild> {
        return firstSome(
         this.oMsg.map(m => m.guild),
         this.oInterac.map(i => i.guild)
        );
    }
    public get guildId() : Nullish<Snowflake> {
        return firstSome(
         this.oMsg.map(m => m.guildId),
         this.oInterac.map(i => i.guildId)
       );
    }
    public get member() : Nullish<GuildMember | APIInteractionGuildMember> {
       return firstSome(
         this.oMsg.map(m => m.member),
         this.oInterac.map(i => i.member)
       ); 
    }
    /*
     * Returns the underlying Context but allows for doing other operations
     */
    public on ( 
      onInteraction : ( interaction : I ) => Awaitable<void>,
      onMsg? : (message : Message) => Awaitable<void>
    ): Context<I> {
      this.oInterac.map(onInteraction);
      this.oMsg.map(m => onMsg?.(m));
      return this;
    }
    public extractInteraction<T>(
      extract :  (interaction : I)  => T
    ): Nullish<T> {
      if(this.oInterac.none) return null;
      return extract(this.oInterac.val);
   }
   public extractMessage<T>(
      extract :  (message: Message)  => T
   ): Nullish<T> {
      if(this.oMsg.none) return null;
      return extract(this.oMsg.val);
   }
    // extract either
   public extractEither<T,V>(
      i : (interaction : I) => T,
      m : (message : Message ) => V
   ) {
      const iExtract = this.extractMessage(m);
      const mExtract = this.extractInteraction(i);
      return iExtract ?? mExtract;
   }
   
}



