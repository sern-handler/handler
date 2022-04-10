//
// Plugins can be inserted on all commands and are emitted
//
// 1.) on ready event, where all commands are loaded. 
// 2.) on corresponding observable (command triggers)
//  
// The goal of plugins is to organize commands and 
// provide extensions to repetitive patterns 
// examples include refreshing modules,
// categorizing commands, cooldowns, permissions, etc
// Plugins are reminisce of middleware in express.
//
//

import type { Err, Ok, Result } from "ts-results";
import type { Override, Wrapper } from "../..";
import { apply, BaseModule, sernModule } from "../structures/modules/module";

export enum PluginType {
    Command = 0b00,
    Event   = 0b01
}

interface Controller {
  next : () => Ok<void>,
  stop : () => Err<void>

}

type executeCmdPlugin = { execute : ( wrapper : Wrapper, controller : Controller ) => Result<void, void> }

interface BasePlugin extends Override<BaseModule, executeCmdPlugin>{
    type : PluginType
}

export type CommandPlugin = {
    type : PluginType.Command
} & Override<BasePlugin, { 
    execute : (wrapper:Wrapper, controller:Controller) => Result<void,void>
}>;

export type EventPlugin = {
    type : PluginType.Event
} & BasePlugin;

export type SernPlugin =
    CommandPlugin
    | EventPlugin;


sernModule(
  
)





