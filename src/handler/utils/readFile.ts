import type { ApplicationCommandOptionData } from "discord.js";
import { readdirSync, statSync } from "fs";
import { basename, join } from "path";
import type * as Sern from "../sern";
export type CommandVal = { mod: Sern.Module<unknown>, options: ApplicationCommandOptionData[], testOnly: boolean }
export const Commands = new Map<string, CommandVal >();
export const Alias = new Map<string, CommandVal>();

//courtesy of Townsy#0001 on Discord
async function readPath(dir: string, arrayOfFiles: string[] = []): Promise<string[]> {
    try {
        const files = readdirSync(dir);
        for (const file of files) {
            if (statSync(dir + "/" + file).isDirectory()) {
                await readPath(dir + "/" + file, arrayOfFiles)
            } else {
                arrayOfFiles.push(join(dir, "/", file));
            }
        }
    } catch (err) {
        throw err;
    }

    return arrayOfFiles;
}

const fmtFileName = (n : string) => {
    const endsW = n.toLowerCase().endsWith("-test.js") || n.toLowerCase().endsWith("-test.ts");
    return endsW 
    ? { cmdName : n.substring(0, n.length - 8), testOnly : true }
    : { cmdName:  n.substring(0, n.length - 3), testOnly: false};
};

export async function registerModules(handler: Sern.Handler): Promise<void> {
    const commandDir = handler.commandDir;
    Promise.all((await getCommands(commandDir)).map(async absPath => {
        return { name: basename(absPath), mod: (await import(absPath)).default as Sern.Module<unknown>, absPath }
    })).then(async modArr => {
        for (const { name, mod, absPath } of modArr) {
            const { cmdName, testOnly } = fmtFileName(name);
            switch (mod.type) {
                case 1: Commands.set(cmdName, { mod, options: [], testOnly }); break;
                case 2:
                case (1 | 2): {
                    const options = ((await import(absPath)).options as ApplicationCommandOptionData[])
                    Commands.set(cmdName, { mod, options: options ?? [], testOnly });
                } break;
                default: throw Error(`${name}.js is not a valid module type.`);
            }

            if (mod.alias.length > 0) {
                for (const alias of mod.alias) {
                    Alias.set(alias, { mod, options: [], testOnly })
                }
            }
        }

    })

}
export async function getCommands(dir: string): Promise<string[]> {
    return readPath(join(process.cwd(), dir))
}



