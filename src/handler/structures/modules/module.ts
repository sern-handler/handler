import type { Awaitable } from 'discord.js';
import type { Args, Module } from '../../..';
import type { SernPlugin } from '../../plugins/plugin';
import type Context from '../context';

export interface BaseModule {
    name?: string;
    description: string;
    execute: (ctx: Context, args: Args) => Awaitable<void>;
}

export interface PluggedModule {
    mod: Module;
    plugins: SernPlugin[];
}
