import type { ApplicationCommandOptionData, Awaitable } from "discord.js";
import type { possibleOutput, Arg } from "../../../types/handler";
import Context from "../context";
import type * as Utils from '../../utilities/preprocessors/args';
import { None, Ok } from "ts-results";
import { CommandType } from "../../sern";
import { SernError } from "../errors";


export abstract class Command {

    protected _name? : string | undefined;
    protected _ctx : Context = new Context( None, None );
    protected _commandType : CommandType;
    protected _options : ApplicationCommandOptionData[] | undefined;
    protected _alias : string[] | undefined;
    protected constructor ( 
        commandType : CommandType,
        alias : string[] | [],
        options?: ApplicationCommandOptionData[],
        name? : string | undefined
    ) {
        this._name = name;
        this._commandType = commandType;
        switch ( commandType ) {
            case CommandType.TEXT : {
              this._options = undefined;
              this._alias = alias;
            } break;
            case CommandType.SLASH : {
              if(alias.length < 0) throw Error(SernError.NO_ALIAS);
              this._options = options;
            } break;
            case CommandType.BOTH : {
              this._options = options; 
              this._alias = alias;
            } break;
            
            
        }
    }

    abstract execute<T> ( args: Ok<T> ) : Awaitable<possibleOutput | void>;
    abstract parse?<T> ( args: Arg ) : Utils.ArgType<T>;
    public set ctx ( context: Context ) {  this._ctx = context; }
    public get name () { return this._name; }
    public get commandType () { return this._commandType; } 
    public get options() { return this._options; }
    public get alias() { return this._alias }
}
