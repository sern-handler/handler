import type { Payload } from './core/types/modules';


export interface SernEventsMapping {
    'module.register': [Payload];
    'module.activate': [Payload];
    error: [Payload];
    warning: [Payload];
    'modulesLoaded': [never?];
}







