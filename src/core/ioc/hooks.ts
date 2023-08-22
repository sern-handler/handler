import type { CoreContainer } from "./container"

interface HookEvent { 
    key : PropertyKey
    newContainer: any
}
type HookName = 'init';

export const createInitListener = (coreContainer : CoreContainer<any>) => {
    const initCalled = new Set<PropertyKey>();
    const hasCallableMethod = createPredicate(initCalled);
    const unsubscribe = coreContainer.on('containerUpserted', async (event) => {
       
        if(isNotHookable(event)) {
            return;
        }

        if(hasCallableMethod('init', event)) {
            await event.newContainer?.init();
            initCalled.add(event.key);
        }

    });
    return { unsubscribe };
}

const isNotHookable = (hk: HookEvent) => {
    return typeof hk.newContainer !== 'object' 
        || Array.isArray(hk.newContainer) 
        || hk.newContainer === null;
}

const createPredicate = <T extends HookEvent>(called: Set<PropertyKey>) => {
    return (hookName: HookName, event: T) => {
        const hasMethod = Reflect.has(event.newContainer!, hookName);
        const beenCalledOnce = !called.has(event.key)

        return hasMethod && beenCalledOnce
    }
}
