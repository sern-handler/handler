import type { CommandType } from "../sern";
import type { Module } from "../structures/structxports";


export function is(mod: Module | undefined, type : CommandType) : boolean {
    return mod !== undefined && (mod.type & type) != 0;
}
