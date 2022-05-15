export type UnionToTuple<T> = T extends readonly [ infer V, infer S ]
    ? V extends V
        ? S extends S
            ? [ V, S ]
            : [ V ]
        : never
    : never;
