import { Presence  } from "../core/presences";
import { Services } from "../core/ioc";
import * as Files from "../core/module-loading";
type SetPresence = (conf: Presence.Result) => Promise<unknown>

const parseConfig = async (conf: Promise<Presence.Result>, setPresence: SetPresence) => {
    const result = await conf;
    
    if ('repeat' in result) {
        const { onRepeat, repeat } = result;
        // Validate configuration
        if (repeat === undefined) {
            throw new Error("repeat option is undefined");
        }
        if (onRepeat === undefined) {
            throw new Error("onRepeat callback is undefined, but repeat exists");
        }
        // Initial state
        let currentState = result;
        const processState = async (state: typeof currentState) => {
            try {
                const result = onRepeat(state);
                // If it's a promise, await it, otherwise use the value directly
                return result instanceof Promise ? await result : result;
            } catch (error) {
                // TODO process error
                //console.error(error);
                return state; // Return previous state on error
            }
        };
        // Handle numeric interval
        if (typeof repeat === 'number') {
            // Return a promise that never resolves (or resolves on cleanup)
            return new Promise((resolve) => {
                // Immediately return initial state
                processState(currentState);
                
                // Set up interval
                let isProcessing = false;
                const intervalId = setInterval(() => {
                    // Skip if previous operation is still running
                    if (isProcessing) return;
                    isProcessing = true;

                    processState(currentState)
                        .then(newState => { 
                            currentState = newState; 
                            return setPresence(currentState)
                        })
                        .catch(console.error)
                        .finally(() => {
                            isProcessing = false;
                        });
                }, repeat);

                // Optional: Return cleanup function
                return () => clearInterval(intervalId);
            });
        }
        // Handle event-based repeat
        else {
            const handler = async () => {
                currentState = await onRepeat(currentState);
                await setPresence(currentState);
            }; 
            let has_registered = false;
            return new Promise((resolve) => {
                const [target, eventName] = repeat;
                
                // Immediately return initial state
                processState(currentState);

                // Set up event listener
                if(!has_registered) {
                    target.addListener(eventName, handler);
                    has_registered=true;
                }
                // Optional: Return cleanup function
                return () => target.removeListener(eventName, handler);
            });
        }
    }
    
    // No repeat configuration, just return the result
    return setPresence(result);
};

export const presenceHandler = async (path: string, setPresence: SetPresence) => {
    const presence = await 
        Files.importModule<Presence.Config<(keyof Dependencies)[]>>(path)
             .then(({ module }) => {
                //fetch services with the order preserved, passing it to the execute fn 
                const fetchedServices = Services(...module.inject ?? []);
                return async () => module.execute(...fetchedServices);
             })
     
    return parseConfig(presence(), setPresence);
       
}
