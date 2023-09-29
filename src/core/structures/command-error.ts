import type { ReplyOptions } from "../../types/utility";
import type { Logging } from "../contracts";

export interface Response { 
    type: 'fail' | 'continue';
    body?: ReplyOptions;
    log?: { type: keyof Logging; message: unknown }
}

export const of = () => {
    const payload = {
        type: 'fail',
        body: undefined,
        log : undefined
    } as Record<PropertyKey, unknown>

    return {
        /**
          * @param {'fail' | 'continue'} p  a status to determine if the error will 
          * terminate your application or continue. Warning and 
         */
        status: (p: 'fail' | 'continue') => {
            payload.type = p;
            return payload;  
        },
        /**
          * @param {keyof Logging} type Determine to log to logger[type].
          * @param {T} message the message to log
          *
          * Log this error with the logger.
          */
        log: <T=string>(type: keyof Logging, message: T) => {
            payload.log = { type, message };
            return payload;
        },
        reply: (bodyContent: ReplyOptions) => {
            payload.body = bodyContent;
            return payload;
        }
    };
}
