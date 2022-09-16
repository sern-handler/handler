export const constFn = <T>(value: T) =>
    () =>
        value;

export const transient = <T>( value : T) => () => constFn(value);