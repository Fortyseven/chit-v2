import { get } from "svelte/store"
import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"
import { llm, LLMInterface } from "../llm/llm"
import { GenericMessage } from "../llm/LLMDriver"
import {
    chatFind,
    chatInProgress,
    chatLength,
    chatSetTitle,
    DEFAULT_CONTEXT,
} from "./chatActions"
import { ChatSession } from "./chatSession"

const Title = z.object({
    short_summary_title: z.string(),
})

const TITLER_PROMPT =
    "Generate a brief title about what this conversation is about."

export async function chatGenerateTitle(chatId: string = "") {
    const chat_session: ChatSession | undefined = chatFind(chatId)
    const _llm: LLMInterface = get(llm)

    // chatInProgress.set(true)

    const current_title = chat_session?.title || ""

    try {
        if (chatLength(chatId) < 2) {
            console.warn("chatGenerateTitle: chat length < 2")
            return
        }

        if (!chat_session) {
            throw Error("chatGenerateTitle: chat session not found")
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

        const llm_instance = get(_llm.driver)

        if (!llm_instance) {
            throw Error("chatGenerateTitle: llm instance not found")
        }

        const messages: GenericMessage[] = [
            {
                role: "system",
                content: TITLER_PROMPT,
            },
            {
                role: "user",
                content: conversation,
            },
        ]

        const response = await llm_instance.chatFormatted(
            messages,
            chat_session?.model_name,
            zodToJsonSchema(Title),
            0.7,
            cur_context
        )

        console.log("RESPONSE: ", response)

        try {
            chatSetTitle(chatId, Title.parse(response).short_summary_title)
        } catch (e) {
            console.error("chatGenerateTitle: failed to parse title", e)
            console.error("response:", response)
            chatSetTitle(chatId, current_title)
        }
    } finally {
        // chatInProgress.set(false)
    }
}
