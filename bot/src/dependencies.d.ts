import type { 
    Logging,
    ErrorHandling,
    CoreDependencies  
} from '@sern/handler'
import type { Publisher } from '@sern/publisher';
import type { Localizer } from '@sern/localizer';
declare global {
   interface Dependencies extends CoreDependencies {
        localizer: Localizer;
        publisher: Publisher
   }
}

export {}



