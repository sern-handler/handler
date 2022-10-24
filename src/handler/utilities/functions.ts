
/**
 * A function that returns whatever value is provided.
 * Used for singleton in iti
 * @param value
 */
export const constFn = <T>(value: T) =>
    () =>
        value;
/**
 * A function that returns another function
 * Used for transient in iti
 * @param value
 */
export const transient = <T>( value : T) => () => constFn(value);
