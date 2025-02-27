import { get } from "svelte/store"
import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"
import llm, { LLMInterface } from "../lib/llm/ollama"
import { chatFind, chatLength, chatSetTitle } from "./chatActions"

const Title = z.object({
    short_summary_title: z.string(),
})

const TITLER_PROMPT =
    "Generate a brief title about what this conversation is about."

export async function chatGenerateTitle(chatId: String = "") {
    const chat_session = chatFind(chatId)
    const _llm: LLMInterface = get(llm)

    if (chatLength(chatId) < 2) {
        console.warn("chatGenerateTitle: chat length < 2")
        return
    }

    // concatenate the user and assistant messages

    let conversation = chat_session?.messages
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .map((msg) => msg.content)
        .join("\n\n")

    conversation =
        "\n```\n" +
        chat_session?.system_prompt +
        "\n\n" +
        conversation +
        "\n```\n"

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
            num_ctx: 65535, // TODO: catch the one in ollama.ts
        },
    })

    console.log(
        "🤖📡 Generated title:",
        Title.parse(JSON.parse(response?.message.content)).short_summary_title
    )

    chatSetTitle(
        chatId,
        Title.parse(JSON.parse(response?.message.content)).short_summary_title
    )
}
