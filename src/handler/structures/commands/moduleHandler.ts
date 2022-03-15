import { CommandType } from "../../sern";
import { SernError } from "../errors";
import type { Modules }  from "../structxports";

export type TextAction = ( mod : Modules.Text ) => unknown;
export type BothAction = ( mod : Modules.Both) => unknown;
export type SlashAction= ( mod : Modules.Slash) => unknown;

export type Action =
    TextAction
    | BothAction
    | SlashAction;


export function onModule<T extends Modules.Module> ( mod: T, action : Action ) : unknown {
    switch (mod.type) {
        case CommandType.TEXT : { 
           return (action as TextAction)(mod); 
        }
        case CommandType.SLASH : {
           return (action as SlashAction)(mod);
        }
        case CommandType.BOTH : {
           return (action as BothAction)(mod);
        }
        default : throw Error(SernError.NOT_VALID_MOD_TYPE);
    }

}

