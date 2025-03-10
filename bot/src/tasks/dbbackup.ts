import { scheduledTask } from "@sern/handler";


export default scheduledTask({
    trigger: "* * * * *",
    execute: (args, { deps }) => {
        console.log("hello")
    }
})
