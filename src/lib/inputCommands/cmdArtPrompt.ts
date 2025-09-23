import { get } from "svelte/store"
import { z } from "zod"
import zodToJsonSchema from "zod-to-json-schema"
import {
    chatFind,
    chatInProgress,
    DEFAULT_CONTEXT,
} from "../chatSession/chatActions"
import { ChatSession } from "../chatSession/chatSession"
import llm, { LLMDriver, LLMInterface } from "../llm/llm"

const ArtPrompt = z.object({
    art_prompt: z.string(),
})

export default async function (args: string[]): Promise<string> {
    const inst = get(get(llm).driver) as LLMDriver

    const SPROMPT =
        "Write a single detailed paragraph visually describing the current moment in a way that can be processed bv an AI art generator. Describe the composition and details using vivid language.  Only respond with the paragraph."

    const chat_session: ChatSession | undefined = chatFind()
    const _llm: LLMInterface = get(llm)

    if (!chat_session) {
        throw Error("cmdArtPrompt: chat session not found")
    }

    // concatenate the user and assistant messages

    let conversation = chat_session?.messages
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .map((msg) => msg.content)
        .join("\n\n")

    conversation =
        "\n```\n" +
        chat_session?.systemPrompt +
        "\n\n" +
        conversation +
        "\n```\n"

    const cur_context = chat_session.settings?.num_ctx || DEFAULT_CONTEXT

    try {
        chatInProgress.set(true)

        const response = await get(_llm.ol_instance)?.chat({
            model: chat_session?.model_name,
            messages: [
                {
                    role: "system",
                    content: SPROMPT,
                },
                {
                    role: "user",
                    content: conversation,
                },
            ],
            format: zodToJsonSchema(ArtPrompt),
            stream: false,
            options: {
                temperature: 0.9,
                num_ctx: cur_context,
            },
        })

        if (response) {
            const art_prompt = ArtPrompt.parse(
                JSON.parse(response?.message.content)
            ).art_prompt
            return art_prompt
        } else {
            throw new Error("cmdArtPrompt: no response")
        }
    } finally {
        chatInProgress.set(false)
    }
}
