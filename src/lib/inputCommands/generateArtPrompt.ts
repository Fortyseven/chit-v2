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
    "Generate a detailed visual description of the current moment in this story. Describe the composition, positions, and details using vivid language. Focus on the visual elements and atmosphere, and avoid mentioning text or dialogue. Be concise but descriptive, capturing the essence of the scene in a way that inspires creativity in an art generation model. Use the conversation context to inform the description, but do not include any narrative or character details that are not visually relevant. The goal is to create a prompt that an AI art generator can use to create an image that represents the current moment in the story."

const SYSTEM_PROMPT_WITH_IMAGE =
    SYSTEM_PROMPT +
    "Incorporate the visual style of the provided image."

/**
 * Generate an art prompt from the current chat session's conversation context.
 *
 * @param additionalInstructions - Optional extra instructions appended to the system prompt
 * @param inputImage - Optional base64 data URL of an input image to include with the inference
 * @returns Promise resolving to the generated art prompt string
 * @throws Error if the LLM driver or chat session is not available
 */
export async function generateArtPrompt(
    additionalInstructions: string = "",
    inputImage: string | null = null,
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

    // Strip data URL prefix for the LLM driver (it prepends its own)
    const rawImageB64 = inputImage
        ? inputImage.startsWith("data:")
            ? inputImage.split(",")[1] || inputImage
            : inputImage
        : null

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
                (rawImageB64 ? SYSTEM_PROMPT_WITH_IMAGE : SYSTEM_PROMPT) +
                (additionalInstructions ? "\n " + additionalInstructions : ""),
        },
        {
            role: "user",
            content: contextText,
            images: rawImageB64 ? [rawImageB64] : undefined,
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
