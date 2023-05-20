import { ErrorHandling } from '../../contracts';

/**
 * @internal
 * @since 2.0.0
 * Version 4.0.0 will internalize this api. Please refrain from using ModuleStore!
 */
export class DefaultErrorHandling implements ErrorHandling {

    keepAlive = 5;

    updateAlive(err: Error) {
        this.keepAlive--;
        if(this.keepAlive === 0) {
           throw err;
        }
    }
}
