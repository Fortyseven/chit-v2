import { z } from "zod"
import { chatInProgress } from "../../chatSession/chatActions"
import { CommandResult, commandResult } from "../inputCommands"

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

export default async function (args: string[]): Promise<CommandResult> {
    const SPROMPT =
        "[OOC: Use a markdown table to describe the poses and relative sizes of our characters. Be specific about the details.{}]"

    try {
        chatInProgress.set(true)

        let args_full = args.join(" ")

        const interpolated = SPROMPT.replace(
            "{}",
            args_full ? `; ${args_full}` : ""
        )

        return commandResult(interpolated, false, true)
    } finally {
        chatInProgress.set(false)
    }
}
