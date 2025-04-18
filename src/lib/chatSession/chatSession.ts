import { derived, get, writable, type Readable } from "svelte/store"
import { appState } from "../appState/appState"
// import { populateTestData } from "./chatTestLoad"

export interface Message {
    content: String
    role: "user" | "assistant" | "system"
    timestamp?: Date
    media?: String
}

export interface ChatSettings {
    temperature: number
    num_ctx: number
}

export enum ChatMediaType {
    IMAGE = "image",
    AUDIO = "audio",
    VIDEO = "video",
}

export interface MediaAttachment {
    data: String
    type: ChatMediaType
}

export interface ChatSession {
    id: String
    title: String
    system_prompt?: String
    model_name: String
    messages: Message[]
    createdAt: Date
    updatedAt: Date
    response_buffer: String
    settings: ChatSettings
    wasAborted: Boolean
    pastedMedia: String
    media_attachments?: MediaAttachment[]
}

export const chats = writable<ChatSession[]>([])

export const currentChat: Readable<ChatSession | null> = derived(
    [chats, appState],
    ([$chats, $appState]) =>
        $chats.find((chat) => chat.id === $appState.activeChatId) || null
)
