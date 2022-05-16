import type { Module, ModuleDefs } from '../structures/module';

export function correctModuleType<T extends keyof ModuleDefs>(
    plug: Module | undefined,
    type: T,
): plug is ModuleDefs[T] {
    return plug !== undefined && plug.type === type;
}