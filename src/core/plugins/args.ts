import type { CommandType } from '../structures/enums';
import type { PluginType } from '../structures/enums';
import type { Module } from '../../types/module';
import type { Processed } from '../../types/core';
import { EventType } from '../structures/enums';
import { CommandArgsMatrix, EventArgsMatrix } from '../../types/module';

export interface InitArgs<T extends Processed<Module>> {
    module: T;
    absPath: string;
}

export type CommandArgs<
    I extends CommandType = CommandType,
    J extends PluginType = PluginType,
> = CommandArgsMatrix[I][J];

export type EventArgs<
    I extends EventType = EventType,
    J extends PluginType = PluginType,
> = EventArgsMatrix[I][J];
