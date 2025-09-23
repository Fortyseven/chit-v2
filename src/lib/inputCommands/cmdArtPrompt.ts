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
import { GenericMessage } from "../llm/LLMDriver"

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

        const driver = await get(_llm.driver)

        if (!driver) {
            throw Error("cmdArtPrompt: llm driver not present")
        }
        const messages: GenericMessage[] = [
            {
                role: "system",
                content: SPROMPT,
            },
            {
                role: "user",
                content: conversation,
            },
        ]

        const response = await driver.chatFormatted(
            messages,
            chat_session?.model_name || "",
            zodToJsonSchema(ArtPrompt),
            0.9,
            cur_context
        )

        console.log("RESPONSE", response)
        console.log("RESPONSE2", ArtPrompt.parse(response))

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
