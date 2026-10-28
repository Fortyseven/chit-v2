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
        "[OOC: Inside a markdown code block generate an SVG drawing depicting the current moment of this story. Use simple shapes, lines, and colors to represent the scene. Focus on the characters and their current poses relative to each other. Use the conversation context to inform this new drawing. The goal is to create a simple, clear SVG representation of the current moment in the story. Include any important objects or background elements that are relevant to the scene. The drawing does not need to be complicated, but it should clearly convey the essence of the scene. Use SVG elements such as <rect>, <circle>, <line>, and <path> to create the drawing.]"

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
