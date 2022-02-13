


enum sEvent  {
    GLOBAL_SLASH,
    LOCAL_SLASH,
    TEXT_CMD,
    CRASH,
}

class Logger {

    public log<T extends sEvent>(e : T, message: string) {
        console.log(`[${"ISOSTRING (todo) "}][${sEvent[e]}] :: ${message}`)
    }
}