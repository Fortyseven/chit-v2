import cmdArtPrompt from "./cmdArtPrompt"
import cmdRPStats from "./rp/cmdRPStats"

interface Command {
    description: string
    action: (args: string[]) => Promise<string> | string
}

interface CommandList {
    [key: string]: Command
}

const COMMANDS: CommandList = {
    art: {
        description: "Generate a prompt based on the current conversation.",
        action: cmdArtPrompt,
    },
    stats: {
        description:
            "Macro for prompting that generates stats for characters in an RP session.",
        action: cmdRPStats,
    },
    help: {
        description: "List all available commands.",
        action: cmdHelp,
    },
}

async function cmdHelp(): Promise<string> {
    let helpText = "Available commands:\n"
    for (const command in COMMANDS) {
        helpText += `- ${command}: ${COMMANDS[command].description}\n`
    }
    return helpText
}

export async function handleCommand(args: string): Promise<string> {
    const command = args.split(" ")[0]
    const commandArgs = args.split(" ").slice(1)

    if (command in COMMANDS) {
        const commandObj = COMMANDS[command]
        if (typeof commandObj.action === "function") {
            return await commandObj.action(commandArgs)
        } else {
            throw new Error(`Command ${command} is not a function`)
        }
    } else {
        return `Command ${command} not found. Type 'cmdHelp' for a list of available commands.`
    }
}
export function getCommandList() {
    return Object.keys(COMMANDS)
}
