import type { ReasoningEffort } from "$lib/chatSession/chatSession"
import type { RouterModelInfo, RouterSlotInfo } from "./routerModels"

export type GenericMessage = {
    role: "system" | "user" | "assistant"
    content: string
    images?: string[]
    audio?: string[]
}

export interface ChatConfig {
    temp?: number
    ctx?: number
    stream?: boolean
    enable_thinking?: boolean
    reasoning_effort?: ReasoningEffort
    thinking_budget_tokens?: number
    top_p?: number
    presence_penalty?: number
    repeat_penalty?: number
    top_k?: number
    seed?: number
}

/**
 * Strip Markdown code fences that some models wrap JSON responses in.
 * Handles ``` and ```json variants with optional surrounding whitespace.
 */
export function stripJsonFences(raw: string): string {
    return raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim()
}

export interface LLMDriver {
    abort(): void
    refreshModels(): Promise<void>
    listModels(): any[]

    chat(
        chatId: string,
        messages: GenericMessage[],
        model: string,
        config: ChatConfig
    ): Promise<void | string>

    chatFormatted(
        messages: GenericMessage[],
        model: string,
        format: any,
        config: ChatConfig
    ): Promise<string>

    kind(): "openai"

    /** Unload all currently loaded models (router-mode servers only). */
    unloadAllModels?(): Promise<void>

    /**
     * Context window (meta.n_ctx) the given model is currently loaded with,
     * or undefined if the model isn't loaded or the server can't report it.
     * Router-mode servers only.
     */
    getModelContext?(model: string): Promise<number | undefined>

    /** Base URL without the /v1 suffix (router-native endpoint root). */
    readonly routerBase?: string

    /** Full router model entries (status/meta/architecture); null if not a router. */
    getRouterModels?(): Promise<RouterModelInfo[] | null>

    /** Load a model via the router (POST /models/load). */
    routerLoadModel?(model: string): Promise<void>

    /** Unload one model via the router (POST /models/unload). */
    routerUnloadModel?(model: string): Promise<void>

    /** Slot stats via the router proxy; null when unavailable. */
    getRouterSlots?(model: string): Promise<RouterSlotInfo[] | null>
}
