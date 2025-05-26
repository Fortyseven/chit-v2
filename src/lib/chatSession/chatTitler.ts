import { get } from "svelte/store"
import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"
import llm, { LLMInterface } from "../llm/ollama"
import {
    chatFind,
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

    console.log("CTX", cur_context)

    const response = await get(_llm.ol_instance)?.chat({
        model: chat_session?.model_name,
        messages: [
            {
                role: "system",
                content: TITLER_PROMPT,
            },
            {
                role: "user",
                content: conversation,
            },
        ],
        format: zodToJsonSchema(Title),
        stream: false,
        options: {
            temperature: 0.6,
            num_ctx: cur_context, // TODO: catch the one in ollama.ts
        },
    })

    chatSetTitle(
        chatId,
        Title.parse(JSON.parse(response?.message.content)).short_summary_title
    )
}
