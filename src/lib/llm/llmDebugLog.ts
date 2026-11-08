import { writable } from "svelte/store"

export type LLMDebugKind = "chat" | "chatFormatted" | "completeText"

export interface LLMDebugResponse {
    status: "ok" | "error" | "aborted"
    /** Final message content as it landed in the session (or raw output for non-chat calls). */
    content?: string
    /** Assistant reasoning/thoughts, when the session captured any. */
    thoughts?: string
    /** Tool calls executed during the turn, when any. */
    toolCalls?: any[]
    /** Error message when the call failed. */
    error?: string
}

export interface LLMDebugExchange {
    id: string
    chatId: string
    kind: LLMDebugKind
    /** Short human label, e.g. "chat · initial" or "chat · tool follow-up". */
    label: string
    model: string
    timestamp: number
    durationMs?: number
    /** The exact request body sent to the LLM (wire format). */
    request: any
    response?: LLMDebugResponse
}

/** Keep the log bounded; oldest entries are dropped first. */
const MAX_ENTRIES = 25

export const llmDebugLog = writable<LLMDebugExchange[]>([])
export const llmDebugPanelOpen = writable(false)

/**
 * Record an outgoing LLM request. Returns the exchange id, to be
 * passed to llmDebugLogFinish once the response side is known.
 */
export function llmDebugLogStart(params: {
    chatId?: string
    kind: LLMDebugKind
    label?: string
    model: string
    request: any
}): string {
    const id = crypto.randomUUID()
    llmDebugLog.update((entries) => [
        {
            id,
            chatId: params.chatId ?? "",
            kind: params.kind,
            label: params.label ?? params.kind,
            model: params.model,
            timestamp: Date.now(),
            request: params.request,
        },
        ...entries,
    ].slice(0, MAX_ENTRIES))
    return id
}

/**
 * Fill in the response side of a recorded exchange (status, content,
 * tool calls, error) and stamp its duration.
 */
export function llmDebugLogFinish(id: string, response: LLMDebugResponse): void {
    llmDebugLog.update((entries) =>
        entries.map((e) =>
            e.id === id
                ? { ...e, response, durationMs: Date.now() - e.timestamp }
                : e
        )
    )
}

/** Drop all recorded exchanges. */
export function llmDebugLogClear(): void {
    llmDebugLog.set([])
}

/** Toggle the debug panel (bound to ALT+C). */
export function llmDebugTogglePanel(): void {
    llmDebugPanelOpen.update((open) => !open)
}
