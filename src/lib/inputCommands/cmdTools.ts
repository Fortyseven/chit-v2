import { tools } from "../tools/index"
import { CommandResult, commandResult } from "./inputCommands"

/**
 * List all registered tools with their descriptions
 */
export default async function (args: string[]): Promise<CommandResult> {
    let toolsText = "Available tools:\n\n"

    if (tools.length === 0) {
        toolsText += "No tools registered.\n"
    } else {
        for (const tool of tools) {
            toolsText += `• ${tool.name}: ${tool.description}\n`

            // Show parameters if available
            if (tool.parameters && Object.keys(tool.parameters).length > 0) {
                toolsText += `  Parameters: ${Object.keys(tool.parameters).join(", ")}\n`
            }
        }
    }

    return commandResult(toolsText, true, false)
}
