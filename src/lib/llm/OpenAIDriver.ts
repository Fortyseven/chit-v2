import { get, Writable, writable } from "svelte/store"
import { sndPlayResponse, sndPlayTyping, sndStopTyping } from "../audio"
import {
    chatAppendStreamingPending,
    chatFinish,
    chatInProgress,
    chatPromoteStreamingPending,
    chatSetWasAborted,
    DEFAULT_TEMPERATURE,
} from "../chatSession/chatActions"
import type { GenericMessage, LLMDriver } from "./LLMDriver"

export class OpenAIDriver implements LLMDriver {
    baseURL: string
    apiKey: string
    models: Writable<string[]> = writable([])

    constructor(baseURL: string, apiKey: string) {
        // Normalize: ensure /v1 suffix
        const base = baseURL.replace(/\/+$/, "")
        this.baseURL = base.endsWith("/v1") ? base : `${base}/v1`
        this.apiKey = apiKey
    }

    async chatFormatted(
        messages: GenericMessage[],
        model: string,
        format: any,
        temp?: number,
        ctx?: number
    ): Promise<any> {
        console.log("FORMAT", format)
        // Use OpenAI JSON mode for structured output
        // If format is provided, append a system prompt to steer the model
        let oaiMessages = messages.map((m) => {
            if (m.images && m.images.length > 0) {
                return {
                    role: m.role,
                    content: [
                        { type: "text", text: m.content },
                        ...m.images.map((img64) => ({
                            type: "image_url",
                            image_url: `data:image/png;base64,${img64}`,
                        })),
                    ],
                }
            }
            return { role: m.role, content: m.content }
        })
        if (format && typeof format === "object" && format !== null) {
            const keys = Object.keys(format.properties || {})
            const example = JSON.stringify(format, null, 2)
            oaiMessages = [
                {
                    role: "system",
                    content:
                        `Respond ONLY with a valid JSON object with these property names: ${keys.join(
                            ", "
                        )}. ` +
                        `Format your response exactly as: ${example}. Do not include any extra text or explanation.`,
                },
                ...oaiMessages,
            ]
        }

        const body: any = {
            model,
            messages: oaiMessages,
            temperature: temp ?? DEFAULT_TEMPERATURE,
            stream: false,
            response_format: { type: "json_object" },
        }
        if (ctx) {
            body.num_ctx = ctx
        }

        const res = await fetch(`${this.baseURL}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        // OpenAI returns choices[0].message.content as valid JSON
        return JSON.parse(data.choices?.[0]?.message?.content)
    }

    async refreshModels() {
        try {
            const res = await fetch(`${this.baseURL}/models`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            const arr = Array.isArray(data) ? data : data?.data || []
            const names = arr
                .map((m: any) => m?.id)
                .filter(Boolean)
                .sort((a: string, b: string) => a.localeCompare(b))
            this.models.set(names)
        } catch (e) {
            console.error("OpenAI refreshModels error:", e)
            this.models.set([])
        }
    }

    listModels(): string[] {
        return get(this.models)
    }

    kind(): "ollama" | "openai" {
        return "openai"
    }

    async chat(
        chatId: string,
        messages: GenericMessage[],
        model: string,
        temp?: number
    ) {
        chatInProgress.set(true)
        chatSetWasAborted(chatId, false)
        const controller = new AbortController()
        try {
            const oaiMessages = messages.map((m) => {
                if (m.images && m.images.length > 0) {
                    return {
                        role: m.role,
                        content: [
                            { type: "text", text: m.content },
                            ...m.images.map((img64) => ({
                                type: "image_url",
                                image_url: `data:image/png;base64,${img64}`,
                            })),
                        ],
                    }
                }
                return { role: m.role, content: m.content }
            })

            const res = await fetch(`${this.baseURL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: oaiMessages,
                    temperature: temp ?? DEFAULT_TEMPERATURE,
                    stream: true,
                }),
                signal: controller.signal,
            })
            if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            sndPlayTyping()

            let buffer = ""
            while (true) {
                const { value, done } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })

                let idx
                while ((idx = buffer.indexOf("\n")) >= 0) {
                    const line = buffer.slice(0, idx).trim()
                    buffer = buffer.slice(idx + 1)
                    if (!line.startsWith("data:")) continue
                    const payload = line.slice(5).trim()
                    if (payload === "[DONE]") {
                        break
                    }
                    try {
                        const json = JSON.parse(payload)
                        const delta = json.choices?.[0]?.delta?.content || ""
                        if (delta) chatAppendStreamingPending(chatId, delta)
                    } catch {}
                }
            }
        } catch (e) {
            console.error("OpenAI chat error:", e)
        } finally {
            chatPromoteStreamingPending(chatId)
            chatInProgress.set(false)
            sndStopTyping()
            sndPlayResponse()
            chatFinish(chatId)
        }
    }
}
