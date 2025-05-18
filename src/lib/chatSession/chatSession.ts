import { derived, writable, type Readable } from "svelte/store"
import { appState } from "../appState/appState"
import { MediaAttachment } from "./chatAttachments"
// import { populateTestData } from "./chatTestLoad"

export interface Message {
    content: String
    role: "user" | "assistant" | "system"
    timestamp?: Date
    media?: MediaAttachment[]
}

export interface ChatSettings {
    temperature: number
    num_ctx: number
}

export interface ChatSession {
    id: String
    title: String
    systemPrompt?: String
    model_name: String
    messages: Message[]
    createdAt: Date
    updatedAt: Date
    response_buffer: String
    settings: ChatSettings
    wasAborted: Boolean
    // pastedMedia: Blob | undefined
    pastedMedia: MediaAttachment[] | undefined
}

export const chats = writable<ChatSession[]>([])

export const currentChat: Readable<ChatSession | null> = derived(
    [chats, appState],
    ([$chats, $appState]) =>
        $chats.find((chat) => chat.id === $appState.activeChatId) || null
)
