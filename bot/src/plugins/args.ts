/**
 * @author HighArcs
 * @version 1.0.0
 * @description converts array of argument strings to an object (and maps them)
 * @license null
 * @example
 * ```ts
 * import { parsedCommandModule, args } from "../plugins/args";
 * import { CommandType } from "@sern/handler";
 *
 * interface Arg {
 * 	 value: number;
 * }
 *
 * export default parsedCommandModule({
 *  type : CommandType.Text
 *  plugins: [args({ value: Number })],
 * 	execute: (ctx, args) => {
 * 		console.log(ctx.args.value);
 * 	}
 * })
 */

import {
    commandModule,
    CommandType,
    Context, ControlPlugin,
    Plugin, CommandControlPlugin, controller
} from "@sern/handler";
import type { Awaitable } from "discord.js";

type Converter<T> = (value?: string) => Awaitable<T>;
type Struct = Record<string, any>;
type ConverterList<T extends Struct> = {
    [K in keyof T]: Converter<T[K]>;
};
type Ctx<T> = Context & { _args: T };

interface Err {
    key: string;
    error: string;
    given: string;
    index: number;
}

type OnError<T> = (context: Ctx<T>, error: Err) => any;

type SpecialEvt<T> = {
    readonly "@@plugin": symbol
} & ControlPlugin<[Ctx<T>, ]>

async function convert<T extends Struct>(
    args: Array<string>,
    struct: ConverterList<T>
) {
    const entries = Object.entries(struct);
    const result = {} as T;
    for (let i = 0; i < entries.length; i++) {
        const value = args[i];
        const [key, converter] = entries[i]!;
        try {
            result[key as keyof T] = await converter(value);
        } catch (error) {
            throw { key, error: String(error), given: value, index: i };
        }
    }

    return result;
}

interface ParsedInputCommandModule<T extends Struct> {
    name?: string;
    description: string;
    type: CommandType.Both | CommandType.Text | CommandType.Slash;
    execute: (context: Ctx<T>, args: Array<string>) => any;
    plugins: () =>
        | [SpecialEvt<T>, ...Array<Plugin>]
        | []
        | undefined;
}

export const Structs = {
    string: (value: string) => String(value),
    number: (value: string) => Number(value),
    boolean: (value: string) => value === "true" || value === "1",
    date: (value: string) => new Date(value),
    integer: (value: string) => Number.parseInt(value),
};

export function parsedCommandModule<T extends Struct>(
    a: ParsedInputCommandModule<T>
) {
    const plugins = (a.plugins() ?? []);
    return commandModule({ ...a, plugins } as never);
}

export namespace Checks {
    export function choices<K extends string>(
        choices: K[],
        value?: string
    ): asserts value is K {
        if (!choices.includes(value as unknown as K)) {
            throw "value is not in choices";
        }
    }

    export function required(value?: string): asserts value is string {
        if (value === undefined) {
            throw "value is required";
        }
    }

    export function limit(min: number, max: number, value?: string) {
        required(value);
        const val = Structs.number(value);
        if (val < min) {
            throw `value must be higher than ${min}`;
        }

        if (val > max) {
            throw `value must be lower than ${max}`;
        }

        return val;
    }
}

export function args<T extends Struct>(
    struct: ConverterList<T>,
    onError?: OnError<T>
): SpecialEvt<T> {
    const plugin =  CommandControlPlugin<CommandType.Both>(async (ctx, args) => {
        switch(args.type) {
            case "slash": {
                let result: T;
            } break;
            case "text" : {
                let result: T;
                try {
                    result = await convert(args, struct)
                } catch (e) {
                    if (onError) {
                      onError(ctx as Ctx<T>, e as Err);
                    }
                    return controller.stop();
                }
                //@warn - mutable assignment!
                (ctx as Ctx<T>)._args = result;
                return controller.next();
            }
        }
        return controller.next()
    })
    Object.defineProperty(plugin, "@@plugin", { value: Symbol("args") })
    return plugin as SpecialEvt<T>;
}
