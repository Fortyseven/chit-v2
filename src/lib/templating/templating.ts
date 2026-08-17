import { get } from "svelte/store"
import { chatFind } from "../chatSession/chatActions"
import { chats, currentChat } from "../chatSession/chatSession"

interface Template {
    name: string
    resolver: () => string
}

const SYSTEM_PROMPTS: Template[] = [
    {
        name: "date",
        resolver: () => {
            const date = new Date()
            return date.toLocaleDateString()
        },
    },
    {
        name: "time",
        resolver: () => {
            const date = new Date()
            return date.toLocaleTimeString()
        },
    },
    {
        name: "now",
        resolver: () => {
            const date = new Date()
            return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`
        },
    },
]

export function applySystemVariables(prompt: string): string {
    if (!prompt) {
        return prompt
    }
    let newPrompt = prompt

    // system template pass
    for (const key in SYSTEM_PROMPTS) {
        const template = SYSTEM_PROMPTS[key]
        const regex = new RegExp(`{{${template.name}}}`, "g")
        newPrompt = newPrompt.replace(regex, template.resolver())
    }

    return newPrompt
}

/**
 * Inject the optional secondary system prompt into the main prompt.
 * - If the secondary prompt is empty/whitespace, the main prompt is returned unchanged.
 * - If the main prompt contains a literal `{{}}` placeholder, the first occurrence
 *   is replaced with the secondary prompt.
 * - Otherwise the secondary prompt is appended after a blank line.
 * Call this BEFORE the templating passes so `{{name}}` variables inside the
 * secondary prompt are also resolved.
 */
export function applySecondaryPrompt(
    mainPrompt: string,
    secondary?: string
): string {
    const sec = secondary?.trim()
    if (!sec || !mainPrompt) return mainPrompt || ""

    if (mainPrompt.includes("{{}}")) {
        // String.replace with a string pattern replaces the first occurrence only
        return mainPrompt.replace("{{}}", sec)
    }

    return mainPrompt + "\n\n" + sec
}

export function applyUserVariables(prompt: string): string {
    if (!prompt) {
        return prompt
    }
    let newPrompt = prompt

    // user template pass
    const chat = get(currentChat)

    if (!chat) {
        throw new Error("No chat found")
    }

    for (const key in chat.templateVariables) {
        const variable = chat.templateVariables[key]
        const regex = new RegExp(`{{${key}}}`, "g")
        newPrompt = newPrompt.replace(regex, variable)
    }

    return newPrompt
}

export function recalculateUserVariables(chatId: string) {
    const chat = chatFind(chatId)

    if (!chat) {
        throw new Error("Chat not found" + chatId)
    }

    // make sure we don't have any system variables hanging around,
    // by calculating them here, we remove them as user candidates

    const sptSPrompt = applySystemVariables(chat.systemPrompt || "")

    // enumerate user template variables

    const templateUserVariables = sptSPrompt.match(/{{(.*?)}}/g)

    if (templateUserVariables) {
        const variables = templateUserVariables.map((variable) => {
            return variable.replace(/{{|}}/g, "")
        })

        // create them, using their existing values if present

        for (const variable_name of variables) {
            // `{{}}` (empty name) is the secondary-prompt injection slot,
            // not a user variable — skip it so it doesn't show up in the UI
            if (!variable_name) continue

            chatUpdateTemplateVariableValue(
                chatId,
                variable_name,
                chat.templateVariables[variable_name] || ""
            )
        }

        // remove any vars no longer referenced in the template

        for (const existingKey of Object.keys(chat.templateVariables)) {
            if (!variables.includes(existingKey)) {
                delete chat.templateVariables[existingKey]
            }
        }
    } else {
        chat.templateVariables = {}
    }
}

export function chatUpdateTemplateVariableValue(
    chatId: string = "",
    key: string,
    value: string
) {
    if (!chatId && currentChat) chatId = get(currentChat)?.id as string

    chats.update((chats) => {
        const chat = chats.find((chat) => chat.id === chatId)
        if (chat) {
            chat.templateVariables[key] = value
        }
        return chats
    })
}
