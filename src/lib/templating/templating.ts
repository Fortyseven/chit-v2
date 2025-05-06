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
]

export function applySystemPromptTemplates(prompt: string): string {
    let newPrompt = prompt

    if (!newPrompt) {
        throw new Error("No system prompt found")
    }

    // system template pass
    for (const key in SYSTEM_PROMPTS) {
        const template = SYSTEM_PROMPTS[key]
        const regex = new RegExp(`{{${template.name}}}`, "g")
        newPrompt = newPrompt.replace(regex, template.resolver())
    }

    console.debug("System prompt after template pass: ", newPrompt)

    return newPrompt
}
