import { get, Writable, writable } from "svelte/store"
import { sndPlayResponse, sndPlayTyping, sndStopTyping } from "../audio"
import {
    chatAppendStreamingPending,
    chatFind,
    chatFinish,
    chatInProgress,
    chatPromoteStreamingPending,
    chatSetToolCallInfo,
    chatSetWasAborted,
    DEFAULT_TEMPERATURE,
} from "../chatSession/chatActions"
import type { ChatConfig, GenericMessage, LLMDriver } from "./LLMDriver"
import { QwenToolDetector } from "./qwenToolDetection"
import { ThinkingDetector } from "./thinkingDetection"

export class OpenAIDriver implements LLMDriver {
    baseURL: string
    apiKey: string
    models: Writable<string[]> = writable([])
    currentController: AbortController | null = null

    constructor(baseURL: string, apiKey: string) {
        // Normalize: ensure /v1 suffix
        const base = baseURL.replace(/\/+$/, "")
        this.baseURL = base.endsWith("/v1") ? base : `${base}/v1`
        this.apiKey = apiKey
    }

    abort() {
        if (this.currentController) {
            this.currentController.abort()
            this.currentController = null
        }
    }

    async chatFormatted(
        messages: GenericMessage[],
        model: string,
        format: any,
        config: ChatConfig = {}
    ): Promise<string> {
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
            const exampleObj: Record<string, string> = {}
            for (const key of keys) exampleObj[key] = `<${key}>`
            const example = JSON.stringify(exampleObj, null, 2)
            const jsonInstruction = `Respond ONLY with a valid JSON object with these property names: ${keys.join(
                ", "
            )}. Format your response exactly as: ${example}. Do not include any extra text or explanation.`
            // Check if first message is a system prompt
            if (oaiMessages.length > 0 && oaiMessages[0].role === "system") {
                // Append instruction to existing system prompt
                oaiMessages[0].content = `${oaiMessages[0].content}\n${jsonInstruction}`
            } else {
                // Insert new system prompt
                oaiMessages = [
                    {
                        role: "system",
                        content: jsonInstruction,
                    },
                    ...oaiMessages,
                ]
            }
        }

        const body: any = {
            model,
            messages: oaiMessages,
            temperature: config.temp ?? DEFAULT_TEMPERATURE,
            // num_ctx: config.ctx ?? DEFAULT_CONTEXT,
            stream: config.stream ?? false,
            response_format: { type: "json_object" },
            think: false,
            chat_template_kwargs: { enable_thinking: false }
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
        config: ChatConfig = {}
    ): Promise<void | string> {
        chatInProgress.set(true)
        chatSetWasAborted(chatId, false)
        this.currentController = new AbortController()
        const controller = this.currentController
        try {
            // Check if tools are enabled for this chat
            const chat = chatFind(chatId)
            const toolsEnabled = chat?.toolsEnabled ?? false

            const oaiMessages = messages.map((m) => {
                if (m.images && m.images.length > 0) {
                    const imageBlocks = m.images.map((img64) => ({
                        type: "image_url",
                        image_url: { url: `data:image/png;base64,${img64}` },
                    }))
                    return {
                        role: m.role,
                        content: [
                            { type: "text", text: m.content },
                            ...imageBlocks,
                        ],
                    }
                }
                return { role: m.role, content: m.content }
            })

            // Prepare tool definitions if enabled
            let toolDefinitions: any[] | undefined = undefined
            if (toolsEnabled) {
                const { tools } = await import('../tools/index')
                toolDefinitions = tools.map(tool => ({
                    type: "function",
                    function: {
                        name: tool.name,
                        description: tool.description,
                        parameters: {
                            type: "object",
                            properties: tool.parameters,
                            required: Object.keys(tool.parameters)
                        }
                    }
                }))
                console.log('🔧 Tools enabled, sending definitions:', toolDefinitions)
            }

            const requestBody: any = {
                model,
                messages: oaiMessages,
                temperature: config.temp ?? DEFAULT_TEMPERATURE,
                stream: config.stream ?? true,
                chat_template_kwargs: { enable_thinking: config.enable_thinking }
            }

            if (toolDefinitions && toolDefinitions.length > 0) {
                requestBody.tools = toolDefinitions
                requestBody.tool_choice = "auto"
            }

            const res = await fetch(`${this.baseURL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            })
            if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            sndPlayTyping()

            const thinkingDetector = new ThinkingDetector()
            const qwenToolDetector = new QwenToolDetector()
            let buffer = ""
            let toolCallsBuffer: any[] = []
            let hasToolCalls = false
            let isQwenFormat = false
            let assistantMessage = ""

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
                        const delta = json.choices?.[0]?.delta
                        if (!delta) continue

                        // Handle OpenAI native tool calls in streaming response
                        if (delta.tool_calls) {
                            hasToolCalls = true
                            console.log('🔧 OpenAI native tool calls detected')
                            for (const toolCallDelta of delta.tool_calls) {
                                const index = toolCallDelta.index ?? 0

                                // Initialize tool call if needed
                                if (!toolCallsBuffer[index]) {
                                    toolCallsBuffer[index] = {
                                        id: toolCallDelta.id || `tool_${index}`,
                                        type: toolCallDelta.type || 'function',
                                        function: {
                                            name: '',
                                            arguments: ''
                                        }
                                    }
                                }

                                // Accumulate function name
                                if (toolCallDelta.function?.name) {
                                    toolCallsBuffer[index].function.name += toolCallDelta.function.name
                                }

                                // Accumulate function arguments
                                if (toolCallDelta.function?.arguments) {
                                    toolCallsBuffer[index].function.arguments += toolCallDelta.function.arguments
                                }
                            }
                        continue
                        }

                        // Process content through Qwen tool detector first (if we have content)
                        let processedContent = delta.content
                        if (delta.content && toolsEnabled) {
                            console.log('🔍 Processing delta.content through Qwen detector:', JSON.stringify(delta.content.substring(0, 200)))
                            const qwenResult = qwenToolDetector.processChunk(delta.content)

                            // Merge detected Qwen tool calls into buffer
                            if (qwenResult.detectedCalls.length > 0) {
                                hasToolCalls = true
                                isQwenFormat = true
                                console.log('🔧 Qwen XML tool calls detected:', qwenResult.detectedCalls.length)
                                toolCallsBuffer.push(...qwenResult.detectedCalls)
                            }

                            // Use stripped content for display and assistant message
                            processedContent = qwenResult.contentToAppend
                            console.log('🔍 Qwen processed content:', JSON.stringify(processedContent.substring(0, 200)))
                        } else if (delta.content) {
                            console.log('⚠️ Delta has content but tools not enabled or no content - toolsEnabled:', toolsEnabled)
                        }

                        // Collect assistant message content (use processed content if Qwen stripping occurred)
                        if (processedContent) {
                            assistantMessage += processedContent
                        }

                        // Process chunk through thinking detector (only if no tool calls)
                        if (!hasToolCalls) {
                            const result = thinkingDetector.processChunk(delta)

                            // Skip marker tags
                            if (result.shouldSkipChunk) continue

                            // Append content to appropriate buffer
                            if (result.contentToAppend) {
                                chatAppendStreamingPending(chatId, result.contentToAppend, result.isThinking)
                            }
                        } else if (processedContent) {
                            // If we have tool calls but still have content to display (e.g., text before/after tool calls)
                            chatAppendStreamingPending(chatId, processedContent, false)
                        }
                    } catch {}
                }
            }

            // Flush any remaining buffered Qwen tool calls at end of stream
            if (toolsEnabled) {
                const flushedCalls = qwenToolDetector.flush()
                if (flushedCalls.length > 0) {
                    hasToolCalls = true
                    isQwenFormat = true
                    console.log('🔧 Flushed Qwen tool calls at end of stream:', flushedCalls.length)
                    toolCallsBuffer.push(...flushedCalls)
                }
            }

            // Execute tool calls and get model's response with results
            if (toolsEnabled && toolCallsBuffer.length > 0) {
                console.log('🔧 Tool calls received:', toolCallsBuffer.length, 'calls')
                console.log('🔧 Tool calls buffer:', JSON.stringify(toolCallsBuffer, null, 2))
                const { getToolByName } = await import('../tools/index')

                // Build tool response messages and collect display info
                const toolMessages: any[] = []
                const toolCallsDisplayInfo: any[] = []

                for (const toolCall of toolCallsBuffer) {
                    if (!toolCall.function?.name) continue

                    const toolName = toolCall.function.name
                    const tool = getToolByName(toolName)

                    console.log(`🔧 Executing tool: ${toolName}`, toolCall.function.arguments)

                    let toolResult: any
                    let toolError: string | null = null
                    let toolParams = toolCall.function.arguments || '{}'

                    try {
                        if (!tool) {
                            toolResult = { error: `Tool ${toolName} not found` }
                            toolError = `Tool ${toolName} not found`
                        } else {
                            // Parse arguments
                            let args = {}
                            try {
                                args = JSON.parse(toolCall.function.arguments || '{}')
                            } catch (err) {
                                toolResult = { error: 'Invalid arguments' }
                                toolError = 'Invalid arguments'
                            }

                            if (!toolResult) {
                                // Execute tool
                                toolResult = await tool.handler(args)
                                console.log(`🔧 Tool result for ${toolName}:`, toolResult)
                            }
                        }
                    } catch (err) {
                        const errorMsg = err instanceof Error ? err.message : String(err)
                        toolResult = { error: errorMsg }
                        toolError = errorMsg
                    }

                    // Store structured tool call info for display
                    toolCallsDisplayInfo.push({
                        name: toolName,
                        params: toolParams,
                        result: JSON.stringify(toolResult),
                        error: toolError
                    })

                    // Add tool result message for the model (not for display)
                    toolMessages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(toolResult)
                    })
                }

                // Store tool call info in buffer for display (not sent to LLM)
                console.log('🔧 Tool calls display info:', JSON.stringify(toolCallsDisplayInfo, null, 2))
                chatSetToolCallInfo(chatId, JSON.stringify(toolCallsDisplayInfo))

                // DON'T promote yet - we'll add tool info as metadata to the final response

                // Now send tool results back to model for final response
                console.log(`🔧 Sending tool results back to model (format: ${isQwenFormat ? 'Qwen XML' : 'OpenAI native'})...`)

                let messagesWithToolResults: any[]
                if (isQwenFormat) {
                    // Qwen format: send tool results as user message with <tool_response> tags
                    const toolResponseContent = toolCallsDisplayInfo.map(tc =>
                        `<tool_response>\n${tc.result}\n</tool_response>`
                    ).join('\n')

                    messagesWithToolResults = [
                        ...oaiMessages,
                        {
                            role: "assistant",
                            content: assistantMessage || "<tool_call>"
                        },
                        {
                            role: "user",
                            content: toolResponseContent
                        }
                    ]
                } else {
                    // OpenAI format: use tool role messages
                    messagesWithToolResults = [
                        ...oaiMessages,
                        {
                            role: "assistant",
                            content: assistantMessage || null,
                            tool_calls: toolCallsBuffer
                        },
                        ...toolMessages
                    ]
                }

                const followUpBody: any = {
                    model,
                    messages: messagesWithToolResults,
                    temperature: config.temp ?? DEFAULT_TEMPERATURE,
                    stream: true,
                    chat_template_kwargs: { enable_thinking: config.enable_thinking }
                }

                // Make second API call with tool results
                const followUpRes = await fetch(`${this.baseURL}/chat/completions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify(followUpBody),
                    signal: controller.signal,
                })

                if (!followUpRes.ok || !followUpRes.body) {
                    throw new Error(`HTTP ${followUpRes.status}`)
                }

                const followUpReader = followUpRes.body.getReader()
                const followUpDecoder = new TextDecoder()
                let followUpBuffer = ""

                // Reset detector for follow-up response
                qwenToolDetector.reset()
                let followUpToolCalls: any[] = []
                let followUpHasTools = false

                // Stream the model's response to tool results
                while (true) {
                    const { value, done } = await followUpReader.read()
                    if (done) break
                    followUpBuffer += followUpDecoder.decode(value, { stream: true })

                    let idx
                    while ((idx = followUpBuffer.indexOf("\n")) >= 0) {
                        const line = followUpBuffer.slice(0, idx).trim()
                        followUpBuffer = followUpBuffer.slice(idx + 1)
                        if (!line.startsWith("data:")) continue
                        const payload = line.slice(5).trim()
                        if (payload === "[DONE]") break

                        try {
                            const json = JSON.parse(payload)
                            const delta = json.choices?.[0]?.delta
                            if (!delta) continue

                            // Handle potential Qwen tool calls in follow-up response
                            let followUpContent = delta.content
                            if (delta.content && toolsEnabled && isQwenFormat) {
                                const qwenResult = qwenToolDetector.processChunk(delta.content)

                                if (qwenResult.detectedCalls.length > 0) {
                                    followUpHasTools = true
                                    followUpToolCalls.push(...qwenResult.detectedCalls)
                                    console.log('🔧 Qwen XML tool calls detected in follow-up:', qwenResult.detectedCalls.length)
                                }

                                followUpContent = qwenResult.contentToAppend
                            }

                            if (followUpContent) {
                                chatAppendStreamingPending(chatId, followUpContent, false)
                            }
                        } catch {}
                    }
                }

                // Flush any remaining buffered Qwen tool calls at end of follow-up stream
                if (toolsEnabled && isQwenFormat) {
                    const flushedCalls = qwenToolDetector.flush()
                    if (flushedCalls.length > 0) {
                        followUpHasTools = true
                        followUpToolCalls.push(...flushedCalls)
                        console.log('🔧 Flushed Qwen tool calls at end of follow-up stream:', flushedCalls.length)
                    }
                }

                // TODO: Handle recursive tool calls if followUpHasTools is true
                if (followUpHasTools) {
                    console.warn('🔧 Model requested additional tool calls in follow-up response - not yet supported')
                    console.warn('Tool calls:', followUpToolCalls)
                }

                console.log('🔧 Model responded with synthesized answer')
            }

        } catch (e) {
            console.error("OpenAI chat error:", e)
        } finally {
            this.currentController = null
            chatPromoteStreamingPending(chatId)
            chatInProgress.set(false)
            sndStopTyping()
            sndPlayResponse()
            chatFinish(chatId)
        }
    }
}
