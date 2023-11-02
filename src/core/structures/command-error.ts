import type { Logging } from "../contracts";

export interface Response { 
    type: 'fail' | 'handled';
    log?: { type: keyof Logging; message: unknown }
}
