import { Result as Either } from 'ts-results-es';


export abstract class Context<Left, Right> {
    private constructor(private _: Either<Left, Right>){}

    abstract get message(): Left; 
    abstract get interaction(): Right;
    abstract get id(): string;

}

export function wrap<Left, Right>(
    val: Left|Right,
    fa: (val: Left|Right
) => Either<Left, Right>) {
    return fa(val);
}
