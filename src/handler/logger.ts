export class DefaultLogger implements Logger<DefaultEvent>  {

    clear () {
        console.clear()
    }

    log(message: string, e: DefaultEvent) {
      console.log(`[${DefaultEvent[e]}] ${message}`)  
    }
    
}

/**
 * @enum {string}
 */
export enum DefaultEvent {
    WARNING,
    ERROR,
    MESSAGE,
    INTERACTION,
    DATABASE,
    INFO
}

export interface Logger<T> {
    
    clear () : void;
    log(message : string, e: T) : void;

}

