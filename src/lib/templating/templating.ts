import { get } from "svelte/store"
import { chatFind } from "../chatSession/chatActions"
import {
    chats,
    currentChat,
    type SubPrompt,
} from "../chatSession/chatSession"

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
 * Inject enabled sub-prompts into the main prompt.
 * - {{N}} (N >= 0) is a slot for sub-prompt N (zero-indexed);
 *   {{}} is an alias for {{0}}.
 * - An enabled sub-prompt whose slot appears in the main prompt replaces
 *   the first occurrence of each present slot with its text; otherwise it
 *   is appended after the main prompt (in order, blank-line separated).
 * - Disabled/empty sub-prompts: their slots (if present) are removed.
 * - Slots referencing non-existent sub-prompts (N >= count) are removed.
 * - Single pass over the main prompt only; {{var}} inside sub-prompt text
 *   is still resolved by the later templating passes.
 * Call this BEFORE the templating passes.
 */
export function applySubPrompts(
    mainPrompt: string,
    subPrompts?: SubPrompt[]
): string {
    const subs = subPrompts || []
    let result = mainPrompt || ""

    // Strip out-of-range slots up front so text inserted later is untouched
    result = result.replace(/\{\{(\d+)\}\}/g, (match, num) =>
        parseInt(num, 10) >= subs.length ? "" : match
    )

    if (subs.length === 0) {
        // {{}} is an alias for the (non-existent) sub-prompt 0
        return result.replace(/\{\{\}\}/g, "")
    }

    const appended: string[] = []

    subs.forEach((sp, index) => {
        const text = sp.text.trim()
        const slots = index === 0 ? ["{{0}}", "{{}}"] : [`{{${index}}}`]

        if (sp.enabled && text) {
            let placed = false
            for (const slot of slots) {
                if (result.includes(slot)) {
                    // String.replace with a string pattern replaces the first occurrence only
                    result = result.replace(slot, text)
                    placed = true
                }
            }
            if (!placed) {
                appended.push(text)
            }
        } else {
            // Disabled or empty: strip its slots
            for (const slot of slots) {
                result = result.split(slot).join("")
            }
        }
    })

    if (appended.length) {
        result = result
            ? result + "\n\n" + appended.join("\n\n")
            : appended.join("\n\n")
    }

    return result
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
            // Numeric names ({{0}}, {{1}}...) and {{}} (empty name) are
            // sub-prompt slots, not user variables — skip them so they
            // don't show up in the UI
            if (!variable_name || /^\d+$/.test(variable_name)) continue

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
