import cmdArtPrompt from "./cmdArtPrompt"
import cmdRPStats from "./rp/cmdRPStats"

export interface CommandResult {
    result: string
    passToInput: boolean
    autoInferResult: boolean
}

interface Command {
    description: string
    action: (args: string[]) => Promise<CommandResult>
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

export function commandResult(
    result: string,
    passToInput: boolean = false,
    autoInferResult: boolean = false
): CommandResult {
    return {
        result,
        passToInput,
        autoInferResult,
    }
}

async function cmdHelp(): Promise<CommandResult> {
    let helpText = "Available commands:\n"
    for (const command in COMMANDS) {
        helpText += `- ${command}: ${COMMANDS[command].description}\n`
    }
    return commandResult(helpText, true, false)
}

/**
 * Accepts a command string direct from the InputBox contents (minus
 * opening slash) and executes the corresponding command if it exists.
 *
 * Returns a CommandResult object containing the result of the command,
 * with details on what to do with it.
 *
 * @param args
 * @returns CommandResult
 * @throws Error if the command does not exist or is not a function
 */
export async function handleCommand(args: string): Promise<CommandResult> {
    const command = args.split(" ")[0]
    const commandArgs = args.split(" ").slice(1)

    if (command in COMMANDS) {
        const commandObj = COMMANDS[command]
        if (typeof commandObj.action === "function") {
            const result = await commandObj.action(commandArgs)
            return result
        } else {
            throw new Error(`Command ${command} is not a function`)
        }
    } else {
        throw new Error(
            `Command ${command} not found; type 'cmdHelp' for a list of available commands.`
        )
    }
}
export function getCommandList() {
    return Object.keys(COMMANDS)
}
