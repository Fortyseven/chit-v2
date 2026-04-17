import { derived, writable, type Readable } from "svelte/store"
import { appState } from "../appState/appState"
import { MediaAttachment } from "./chatAttachments"

export enum AppMode {
    DEFAULT = "DEFAULT",
    RP = "RP",
}

export interface Message {
    id?: string // Unique identifier for stable Svelte keying
    content: string
    thoughts?: string
    role: "user" | "assistant" | "system"
    timestamp?: Date
    media?: MediaAttachment[]
    tool_call_info?: string // Tool call/result info for display only, not sent to LLM
}

export interface ChatSettings {
    temperature: number
    num_ctx: number
    enable_thinking: boolean
    top_p?: number
    presence_penalty?: number
    repeat_penalty?: number
    top_k?: number
    seed?: number
}

export interface ChatTTSSettings {
    voice?: string | null
    rate?: number
    pitch?: number
}

export enum BackpackMode {
    OFF = "",
    SEARCH = "search",
    GEOLOCATION = "geolocation",
}

export interface BackpackReference {
    toolId: string // e.g. "wikipedia"
    referenceUrl: string // url where reference was pulled
    referenceContent: string // actual reference text
}

export interface ChatSession {
    id: string
    title: string
    systemPrompt?: string
    model_name: string
    messages: Message[]
    createdAt: Date
    lastRequestStart: number
    // lastRequestFinish: number
    lastRequestTimer: number
    lastTokenCount: number
    response_buffer: string
    thinking_buffer: string
    tool_call_info_buffer: string // Temporary buffer for tool call display info
    hasThoughts: boolean
    isThinking: boolean
    settings: ChatSettings
    wasAborted: Boolean
    pastedMedia: MediaAttachment[] | undefined
    templateVariables: { [key: string]: string }
    backpackMode: BackpackMode
    backpackReferences: BackpackReference[] | undefined
    currentMode: AppMode
    toolCallMessagesVisible?: boolean // Per-chat toggle for tool call message visibility
    toolsEnabled?: boolean // Per-chat toggle to enable/disable tool calling
    ttsSettings?: ChatTTSSettings // Per-chat TTS overrides (voice, rate, pitch)
    scrollTop?: number // Persisted scroll position for restoring on session switch
}

export const chats = writable<ChatSession[]>([])

export const currentChat: Readable<ChatSession | null> = derived(
    [chats, appState],
    ([$chats, $appState]) =>
        $chats.find((chat) => chat.id === $appState.activeChatId) || null
)

export const currentChatMode: Readable<AppMode> = derived(
    currentChat,
    ($currentChat) => $currentChat?.currentMode || AppMode.DEFAULT
)
