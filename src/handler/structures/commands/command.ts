import type { ApplicationCommandOptionData, Awaitable } from "discord.js";
import type { possibleOutput, Arg } from "../../../types/handler";
import Context from "../context";
import type * as Utils from '../../utilities/preprocessors/args';
import { None, Ok } from "ts-results";
import { CommandType } from "../../sern";
import { SernError } from "../errors";
import type CommandOptions from "./command-options";


export abstract class Command {

    private name? : string | undefined;
    private ctx : Context = new Context( None, None );
    private commandType : CommandType;
    private options : ApplicationCommandOptionData[] | undefined;
    private alias : string[] | undefined;
    private constructor ( 
        { name, commandType, options, alias } : CommandOptions 
    ) {
        this.name = name;
        this.commandType = commandType;
        switch ( commandType ) {
            case CommandType.TEXT : {
              this.options = undefined;
              this.alias = alias;
            } break;
            case CommandType.SLASH : {
              if(alias.length < 0) throw Error(SernError.NO_ALIAS);
              this.options = options;
            } break;
            case CommandType.BOTH : {
              this.options = options; 
              this.alias = alias;
            } break
            
            
        }
    }

    abstract execute<T> ( args: Ok<T> ) : Awaitable<possibleOutput | void>;
    abstract parse?<T> ( args: Arg ) : Utils.ArgType<T>;
    public setCtx ( context: Context ) {  this.ctx = context; }
    public getName () { return this.name; }
    public getCommandType () { return this.commandType; } 
    public getOptions() { return this.options; }
    public getAlias() { return this.alias }
}
