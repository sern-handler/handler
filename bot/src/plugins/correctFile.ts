import {CommandInitPlugin, controller} from "@sern/handler";


export const correctFile = CommandInitPlugin(() => {
    return controller.stop()
})
