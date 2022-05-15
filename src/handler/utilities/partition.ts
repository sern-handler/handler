export function partition<T, U extends T>(condition: (el: T) => el is U, array: T[]): [U[], T[]] {
    const uArr: U[] = [];
    const vArr: T[] = [];
    for (const el of array) {
        (condition(el) ? uArr : vArr).push(el);
    }
    return [uArr, vArr];
}
