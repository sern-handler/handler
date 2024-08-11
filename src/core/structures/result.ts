export type Result<Ok, Err> =
  | { ok: true; value: Ok }
  | { ok: false; error: Err };

export const Ok = <Ok>(value: Ok) => ({ ok: true, value } as const);
export const Err = <Err>(error: Err) => ({ ok: false, error } as const);

export const val = <O, E>(r: Result<O, E>) => r.ok ? r.value : r.error;
export const EMPTY_ERR = Err(undefined);

/**
 * Wrap an async operation that may throw an Error (`try-catch` style) into checked exception style
 * @param op The operation function
 */
export async function wrapAsync<T, E = unknown>(op: () => Promise<T>): Promise<Result<T, E>> {
    try { return op()
            .then(Ok)
            .catch(Err); } 
    catch (e) { return Promise.resolve(Err(e as E)); }
}
