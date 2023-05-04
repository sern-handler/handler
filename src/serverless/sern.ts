import { makeFetcher } from "../core/dependencies";
import { ServerlessWrapper } from "../core/structures/wrapper";
import { makeReadyEvent } from "../handler/events/ready";




function initServerless(wrapper: ServerlessWrapper) {
    const dependenciesAnd = makeFetcher(wrapper.containerConfig);
    const dependencies = dependenciesAnd(['@sern/modules']);
    
    makeReadyEvent(dependencies, wrapper.commands, wrapper.platform)

}

/**
  * For Sern to handle serverless 
 */
function handle(wrapper: ServerlessWrapper) {
    return (r: Request) => {

    }
}

