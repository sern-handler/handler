import { Presence } from '@sern/handler'
import { ActivityType, ClientPresenceStatus } from 'discord.js';

function shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
    }
    return [...array];
}

const statuses = [[ActivityType.Watching, "the sern community", "online"],
                 [ActivityType.Listening, "Evo", "dnd"],
                 [ActivityType.Playing, "with @sern/cli", "idle"],
                 [ActivityType.Watching, "sern bots", "dnd"],
                 [ActivityType.Watching, "github stars go brrr", "online"],
                 [ActivityType.Listening, "Spotify", "dnd"],
                 [ActivityType.Listening, "what's bofa", "idle"]] satisfies 
                 [ActivityType, string, ClientPresenceStatus][];

export default Presence.module({ 
    execute: () => {
        const [type, name, status] = statuses.at(0)!;
        return Presence
            .of({ activities: [ { type, name } ], status }) //start your presence with this.
            .repeated(() => {
                const [type, name, status] = [...shuffleArray(statuses)].shift()!;
                return {
                    status,
                    activities: [{ type, name }]
                };
            }, 60_000); //repeat and setPresence with returned result every minute
    }
})
