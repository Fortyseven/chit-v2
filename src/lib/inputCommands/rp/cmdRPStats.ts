import { z } from "zod"
import { chatInProgress } from "../../chatSession/chatActions"

const Stats = z.object({
    strength: z.number(),
    intelligence: z.number(),
    charisma: z.number(),
    age: z.number(),
    skills: z.array(z.string()),
    clothing: z.string(),
    background: z.string(),
    currentState: z.string(),
})

export default async function (args: string[]): Promise<string> {
    const SPROMPT =
        "[OOC: generate a raw markdown table; provide an update on your character's state, their physical state, what it's thinking, what's it's focused on, what it intends to do next, and where they intend this story to end; do not use a markdown code block{}]"

    const SPROMPT_CHRSHEET =
        "[OOC: generate detailed character sheets for these characters as a raw markdown table: include the usual str/int/chr/age and all that, but also include skills, clothing, a very brief historic backgrounder, and their current state; do not use a markdown code block; use emoji on labels{}]"

    try {
        chatInProgress.set(true)

        let args_full = args.join(" ")

        if (args_full.toLowerCase().includes("/c")) {
            // chop it off
            args_full = args_full.split("/c")[0].trim()
            return `${SPROMPT_CHRSHEET.replace(
                "{}",
                args_full ? `; ${args_full}` : ""
            )}`
        }

        const interpolated = SPROMPT.replace(
            "{}",
            args_full ? `; ${args_full}` : ""
        )

        return `${interpolated}`
    } finally {
        chatInProgress.set(false)
    }
}
