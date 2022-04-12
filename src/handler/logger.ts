
export enum sEvent {
    GLOBAL_SLASH,
    LOCAL_SLASH,
    MISUSE_CMD,
    DM,
    CRASH,
    TEXT_CMD,
}

export default class Logger {
    public clear() {
        console.clear();
    }

    public log<T extends sEvent>(e: T, guildId: string, message: string) {
        // add colored logging?
        console.log(`[${new Date().toISOString()}] [${sEvent[e]}] @ ${guildId} :: ${message}`);
    }

    /**
     *  Utilizes console.table() to print out memory usage of current process.
     *  Optional at startup.
     */
    public tableRam() {
        console.table(
            Object.entries(process.memoryUsage())
                .map(([k, v]: [string, number]) => {
                    return { [k]: `${(((Math.round(v) / 1024 / 1024) * 100) / 100).toFixed(2)} MBs` };
                })
                .reduce((r, c) => Object.assign(r, c), {}),
        );
    }
}
