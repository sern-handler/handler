import { Result as Either } from 'ts-results-es';


export interface Context<Left, Right> {
    get message(): Left; 
    get interaction(): Right;
}

function safeUnwrap<T>(res: Either<T, T>) {
    return res.val;
}

export function wrap<Left, Right>(
    val: Left|Right,
    fa: (val: Left|Right) => Either<Left, Right>
) {
    return fa(val);
}
