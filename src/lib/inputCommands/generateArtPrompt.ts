import { get } from "svelte/store"
import { z } from "zod"
import zodToJsonSchema from "zod-to-json-schema"
import {
    chatFind,
    DEFAULT_CONTEXT,
} from "../chatSession/chatActions"
import { ChatSession } from "../chatSession/chatSession"
import { llm, LLMInterface } from "../llm/llm"
import { GenericMessage } from "../llm/LLMDriver"

const ArtPrompt = z.object({
    art_prompt: z.string(),
})

const SYSTEM_PROMPT =
    "Write a single detailed paragraph visually describing the current moment in a way that can be processed by an AI art generator. Describe the composition and details using vivid language. Only respond with the prompt paragraph."

/**
 * Generate an art prompt from the current chat session's conversation context.
 *
 * @param additionalInstructions - Optional extra instructions appended to the system prompt
 * @returns Promise resolving to the generated art prompt string
 * @throws Error if the LLM driver or chat session is not available
 */
export async function generateArtPrompt(
    additionalInstructions: string = ""
): Promise<string> {
    const _llm: LLMInterface = get(llm)
    const driver = await get(_llm.driver)
    if (!driver) {
        throw Error("generateArtPrompt: LLM driver not present")
    }

    const chat_session: ChatSession | undefined = chatFind()
    if (!chat_session) {
        throw Error("generateArtPrompt: chat session not found")
    }

    // Build conversation context from user + assistant messages
    const conversation = chat_session.messages
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .map((msg) => msg.content)
        .join("\n\n")

    const contextText =
        "\n```\n" +
        (chat_session.systemPrompt || "") +
        "\n\n" +
        conversation +
        "\n```\n"

    const cur_context = chat_session.settings?.num_ctx || DEFAULT_CONTEXT

    const messages: GenericMessage[] = [
        {
            role: "system",
            content:
                SYSTEM_PROMPT +
                (additionalInstructions ? "\n " + additionalInstructions : ""),
        },
        {
            role: "user",
            content: contextText,
        },
    ]

    const response = await driver.chatFormatted(
        messages,
        chat_session.model_name || "",
        zodToJsonSchema(ArtPrompt),
        {
            stream: false,
            temp: 1.0,
            ctx: cur_context,
            enable_thinking: false,
        }
    )

    if (!response) {
        throw new Error("generateArtPrompt: no response from LLM")
    }

    const parsed = ArtPrompt.parse(response)
    return parsed.art_prompt
}
