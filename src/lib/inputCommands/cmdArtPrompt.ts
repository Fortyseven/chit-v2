import { chatInProgress } from "../chatSession/chatActions"
import { generateArtPrompt } from "./generateArtPrompt"
import { CommandResult, commandResult } from "./inputCommands"

export default async function (args: string[]): Promise<CommandResult> {
    const alsoAdd = args.join(" ")

    try {
        chatInProgress.set(true)
        const art_prompt = await generateArtPrompt(alsoAdd)
        return commandResult(art_prompt, true, false)
    } finally {
        chatInProgress.set(false)
    }
}
