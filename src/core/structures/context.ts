import { Result as Either, Ok, Err } from 'ts-results-es';

/**
  *
  * @since 3.0.0
  *
  */
export interface CoreContext<M, I> {
    get message(): M; 
    get interaction(): I;
}

export function safeUnwrap<T>(res: Either<T, T>) {
    return res.val;
}

export function wrap<A extends unknown, B extends unknown>(
    val: B|A,
): Either<A,B> {
   if(typeof val !== 'object' || Array.isArray(val) || val == null) {
       throw Error("Could not form correct Context." + "Recieved " + val) 
   }
   const msgInteractionObject = (val as unknown as { interaction: unknown }).interaction;
   //falsy comparison: ==. Checks if its null OR undefined
   if(msgInteractionObject == null) {
    return Ok(val as A)
   }
   return Err(val as B);
}


