import type { ApplicationCommandOptionData, CommandInteractionOption } from "discord.js";
import { readdirSync, statSync } from "fs";
import { basename, join } from "path";
import type { Sern } from "../sern/sern";

export namespace Files {
    export const Commands = new Map<string, { mod: Sern.Module<unknown>, options:  ApplicationCommandOptionData[] }>();
    export const Alias = new Map<string, { mod: Sern.Module<unknown>, options: ApplicationCommandOptionData[] }>(); 

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
        } catch(err) {
            throw err;
        }
    
        return arrayOfFiles;
    }

    export async function registerModules(handler : Sern.Handler) : Promise<void> {
        const commandDir = handler.commandDir,
              client = handler.client;
        Promise.all((await getCommands(commandDir)).map(async absPath => {
           return { name : basename(absPath), mod:  ( await import(absPath)).default as Sern.Module<unknown>, absPath   }
        })).then( async modArr => {
            for ( const { name, mod, absPath } of modArr) {
                switch (mod.type) {
                    case 2 : Commands.set(name.substring(0, name.length-3), { mod, options: [] }); break;
                    case 4 : {
                        const options = ((await import(absPath)).options as ApplicationCommandOptionData[])
                        Commands.set(name.substring(0, name.length - 3), { mod, options : options ?? [] });
                        } break;
                    case 2 | 4 : {
                        const options = ((await import(absPath)).options as ApplicationCommandOptionData[])
                        Commands.set(name.substring(0, name.length-3),{mod,  options : options ?? [] } );
                    } break;
                    default : throw Error(`${name}.js is not a valid module type.`);
                }
                
                if(mod.alias.length > 0) {
                    for ( const alias of mod.alias) {
                        Alias.set(alias, {mod, options : []})
                    }
                } 
            }
            
        })
    
    }
    export async function getCommands(dir: string) : Promise<string[]> {    
        return readPath(join(process.cwd(), dir ))
    }
}



