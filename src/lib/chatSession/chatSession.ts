import { derived, writable, type Readable } from "svelte/store"
import { appState } from "../appState/appState"
import { MediaAttachment } from "./chatAttachments"

export interface Message {
    content: String
    role: "user" | "assistant" | "system"
    timestamp?: Date
    media?: MediaAttachment[]
}

export enum BackpackMode {
    OFF = "",
    SEARCH = "search",
    GEOLOCATION = "geolocation",
}

export interface ChatSettings {
    temperature: number
    num_ctx: number
}

export interface ChatSession {
    id: string
    title: string
    systemPrompt?: string
    model_name: string
    messages: Message[]
    createdAt: Date
    lastRequestStart: number
    lastRequestFinish: number
    response_buffer: string
    settings: ChatSettings
    wasAborted: Boolean
    pastedMedia: MediaAttachment[] | undefined
    templateVariables: { [key: string]: string }
    backpackMode: BackpackMode
}

export const chats = writable<ChatSession[]>([])

export const currentChat: Readable<ChatSession | null> = derived(
    [chats, appState],
    ([$chats, $appState]) =>
        $chats.find((chat) => chat.id === $appState.activeChatId) || null
)
