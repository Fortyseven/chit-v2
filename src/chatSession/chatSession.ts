import { derived, get, writable, type Readable } from "svelte/store"
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
    [chats, activeChatId],
    ([$chats, $activeChatId]) =>
        $chats.find((chat) => chat.id === $activeChatId) || null
)
