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
import { clearQuoteQueue, queueQuote } from "../voice/quoteTTS"
import type { ChatConfig, GenericMessage, LLMDriver } from "./LLMDriver"
import { stripJsonFences } from "./LLMDriver"
import { QuoteTTSDetector } from "./quoteTTSDetection"
import { ThinkingDetector } from "./thinkingDetection"

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
        config: ChatConfig = {}
    ): Promise<void | string> {
        // debugger
        const inst = get(this.ol_instance)
        if (!inst) {
            throw "Ollama instance not found"
        }

        const payload: ChatRequest = {
            model,
            messages: messages.map(
                (m) =>
                    ({
                        role: m.role,
                        content: m.content,
                        images: m.images,
                    } as Message)
            ),
            stream: config.stream ?? true,
            think: config.enable_thinking ?? true,
            options: {
                temperature: config.temp || DEFAULT_TEMPERATURE,
                num_ctx: config.ctx || DEFAULT_CONTEXT,
                ...(config.top_p !== undefined && { top_p: config.top_p }),
                ...(config.presence_penalty !== undefined && { presence_penalty: config.presence_penalty }),
                ...(config.repeat_penalty !== undefined && { repeat_penalty: config.repeat_penalty }),
                ...(config.top_k !== undefined && { top_k: config.top_k }),
                ...(config.seed !== undefined && { seed: config.seed }),
            },
        }

        if (!chatId) {
            // non-stream, non-chat
            chatInProgress.set(false)
            const result = await inst.chat(payload)
            sndPlayResponse()
            return result.message.content
        } else {
            chatInProgress.set(true)
            chatSetWasAborted(chatId, false)
            this.aborted = false

            if (config.stream === false) {
                // non-stream chat
                const result = await inst.chat(payload)
                chatInProgress.set(false)
                sndPlayResponse()
                chatFinish(chatId)
                return result
            }

            try {
                const stream = await inst.chat(payload)
                this.currentStream = stream
                const thinkingDetector = new ThinkingDetector()
                const quoteTTSDetector = new QuoteTTSDetector()
                for await (const part of stream) {
                    if (this.aborted) {
                        break
                    }

                    // Process chunk through thinking detector
                    const result = thinkingDetector.processChunk(part.message)

                    // Skip marker tags
                    if (result.shouldSkipChunk) continue

                    // Append content to appropriate buffer
                    if (result.contentToAppend) {
                        if (!result.isThinking) {
                            const { completedQuotes } = quoteTTSDetector.processChunk(result.contentToAppend)
                            for (const quote of completedQuotes) queueQuote(quote)
                        }
                        chatAppendStreamingPending(chatId, result.contentToAppend, result.isThinking)
                    }

                    // Play audio feedback every 10 tokens instead of every token
                    if (Math.random() < 0.1) {
                        sndPlayTone(60 + Math.random() * 150, 250, 0.075)
                    }
                }
                // Flush any open quote at end of stream
                for (const quote of quoteTTSDetector.flush()) queueQuote(quote)
            } catch (e) {
                if (e instanceof DOMException && e.name === "AbortError") {
                    clearQuoteQueue()
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
        config: ChatConfig = {}
    ): Promise<any> {
        const inst = get(this.ol_instance)
        if (!inst) {
            throw "Ollama instance not found"
        }

        const payload: ChatRequest = {
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
                temperature: config.temp ?? DEFAULT_TEMPERATURE,
                num_ctx: config.ctx ?? DEFAULT_CONTEXT,
            },
        }

        const result = await inst.chat(payload)

        console.log("chatFormatted result:", result)

        return JSON.parse(stripJsonFences(result.message.content))
    }
}
