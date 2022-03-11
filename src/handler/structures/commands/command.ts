import type { Awaitable } from "discord.js";
import type { possibleOutput, Arg } from "../../../types/handler";
import Context from "../context";
import type * as Utils from '../../utilities/preprocessors/args';
import { None, Ok } from "ts-results";
import type { CommandType } from "../../sern";


export abstract class Command {

    protected name : string | undefined;
    protected _ctx : Context = new Context( None, None );
    protected commandType : CommandType;
    
    protected constructor ( 
        name : string | undefined,
        commandType : CommandType
    ) {
        this.name = name;
        this.commandType = commandType;
    }

    abstract execute<T> ( args: Ok<T> ) : Awaitable<possibleOutput | void>;
    abstract parse?<T> (args: Arg) : Utils.ArgType<T>;
    private set ctx ( context: Context ) {  this._ctx = context; }
}
