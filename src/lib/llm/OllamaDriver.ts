import { ChatRequest, Message, ModelResponse, Ollama } from "ollama/browser"
import { get, Writable, writable } from "svelte/store"
import { sndPlayResponse, sndPlayTone } from "../audio"
import {
    chatAppendStreamingPending,
    chatFinish,
    chatInProgress,
    chatPromoteStreamingPending,
    chatSetWasAborted,
    DEFAULT_CONTEXT,
    DEFAULT_TEMPERATURE,
} from "../chatSession/chatActions"
import type { GenericMessage, LLMDriver } from "./LLMDriver"

export class OllamaDriver implements LLMDriver {
    models: Writable<ModelResponse[]> = writable([])
    ol_instance: Writable<Ollama | undefined> = writable(undefined)
    host = ""
    currentStream: any = null
    aborted: boolean = false

    constructor(host: string) {
        this.host = host
        this.ol_instance.set(new Ollama({ host }))
    }

    abort() {
        this.aborted = true
        if (this.currentStream && this.currentStream.abortController) {
            this.currentStream.abort() // Attempt to close the async iterator
            this.currentStream = null
        }
    }

    async refreshModels() {
        try {
            const inst = get(this.ol_instance)
            if (!inst) {
                return
            }
            const list = await inst.list()
            this.models.set(
                list.models.sort((a: { name: string }, b: { name: string }) =>
                    a.name.localeCompare(b.name)
                )
            )
        } catch (e) {
            console.error("Ollama refreshModels error:", e)
        }
    }

    listModels(): ModelResponse[] {
        return get(this.models)
    }

    kind(): "ollama" | "openai" {
        return "ollama"
    }

    async chat(
        chatId: string, // false if not for chat
        messages: GenericMessage[],
        model: string,
        temp?: number,
        ctx?: number
    ) {
        const inst = get(this.ol_instance)
        if (!inst) {
            console.error("Ollama instance not found")
            return
        }

        const config: ChatRequest = {
            model,
            messages: messages.map(
                (m) =>
                    ({
                        role: m.role,
                        content: m.content,
                        images: m.images,
                    } as Message)
            ),
            stream: true,
            think: false,
            options: {
                temperature: temp ?? DEFAULT_TEMPERATURE,
                num_ctx: ctx ?? DEFAULT_CONTEXT,
            },
        }
        if (!chatId) {
            // non-stream, non-chat
            const result = await inst.chat(config)
            return result.response
        } else {
            chatInProgress.set(true)
            chatSetWasAborted(chatId, false)
            this.aborted = false
            try {
                const stream = await inst.chat(config)
                this.currentStream = stream
                let isThinking = false
                for await (const part of stream) {
                    if (this.aborted) {
                        break
                    }

                    if (
                        part.message.content.toLowerCase() == "<think>" ||
                        (part.message.hasOwnProperty("thinking") && !isThinking)
                    ) {
                        isThinking = true
                        console.debug("Thinking started...")
                        continue
                    } else if (
                        part.message.content.toLowerCase() == "</think>" ||
                        (!part.message.hasOwnProperty("thinking") && isThinking)
                    ) {
                        isThinking = false
                        console.debug("...thinking ended.")
                        continue
                    }
                    chatAppendStreamingPending(
                        chatId,
                        part.message?.thinking || part.message.content,
                        isThinking
                    )
                    sndPlayTone(60 + Math.random() * 150, 250, 0.075)
                }
            } catch (e) {
                if (e instanceof DOMException && e.name === "AbortError") {
                    return
                }
                console.error("Ollama chat error:", e)
            } finally {
                this.currentStream = null
                chatPromoteStreamingPending(chatId)
                chatInProgress.set(false)
                sndPlayResponse()
                chatFinish(chatId)
            }
        }
    }

    async chatFormatted(
        messages: GenericMessage[],
        model: string,
        format: any,
        temp?: number,
        ctx?: number
    ): Promise<void> {
        const inst = get(this.ol_instance)
        if (!inst) {
            console.error("Ollama instance not found")
            return
        }

        const config: ChatRequest = {
            model,
            messages: messages.map(
                (m) =>
                    ({
                        role: m.role,
                        content: m.content,
                        images: m.images,
                    } as Message)
            ),
            stream: false,
            format: format,
            options: {
                temperature: temp ?? DEFAULT_TEMPERATURE,
                num_ctx: ctx ?? DEFAULT_CONTEXT,
            },
        }

        const result = await inst.chat(config)

        return JSON.parse(result.message.content)
    }
}
