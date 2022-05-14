import type { CommandType } from '../sern';
import type { ModuleDefs } from '../structures/modules/commands/moduleHandler';
import type { ParseType } from '../../types/handler';

type UnionToTupleUnion<T extends CommandType> = {
    [K in T] : Parameters<ModuleDefs[K]['execute']>
}[T];
type ParamMap<T extends CommandType> = {
    [K in T] : Parameters<ModuleDefs[K]['execute']>
}[T]


/**
 * Identity function x => x to narrow type of parameters
 * @param params
 */
export function resolveParameters<T extends CommandType>
    ( params: ParamMap<T> ) : UnionToTupleUnion<T>
    {
    return params;
}