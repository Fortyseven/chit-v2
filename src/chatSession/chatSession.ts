import { derived, get, writable, type Readable } from "svelte/store"
import { appState } from "./appState"
// import { populateTestData } from "./chatTestLoad"

export interface Message {
    content: String
    role: "user" | "assistant" | "system"
    timestamp?: Date
    media?: String
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
}

export const chats = writable<ChatSession[]>([])
export const activeChatId = writable<String | null>(null)

export const currentChat: Readable<ChatSession | null> = derived(
    [chats, appState],
    ([$chats, $appState]) =>
        $chats.find((chat) => chat.id === $appState.activeChatId) || null
)
