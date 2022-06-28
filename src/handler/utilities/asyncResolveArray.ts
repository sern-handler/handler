import type { Awaitable } from 'discord.js';

export async function asyncResolveArray<T>(promiseLike: Awaitable<T>[]): Promise<T[]> {
    const arr: T[] = [];
    for await (const el of promiseLike) {
        arr.push(el);
    }
    return arr;
}
