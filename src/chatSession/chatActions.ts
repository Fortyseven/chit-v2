import { get } from "svelte/store"
import { activeChatId, chats, Message } from "./chatSession"

//--------------------------------------------------------------
// Insert a new chat at the end of the list
export function chatNew() {
    const id = crypto.randomUUID()
    const newChat = {
        id,
        title: "New Chat " + new Date().toLocaleString(),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    chats.update(($chats) => [...$chats, newChat])
    activeChatId.set(id)
}

export function chatSetModel(chatId: string, modelName: string) {
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    model_name: modelName,
                    updatedAt: new Date(),
                }
            }
            return chat
        })
    )
}

export function chatSetSystemPrompt(chatId: string, systemPrompt: string) {
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    system_prompt: systemPrompt,
                    updatedAt: new Date(),
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
// Change the active chat
export function chatSwitchTo(chatId: string) {
    activeChatId.set(chatId)
}

//--------------------------------------------------------------
// Delete a chat
export function chatDelete(chatId: string) {
    chats.update(($chats) => $chats.filter((chat) => chat.id !== chatId))

    // there must always be one
    if (get(chats).length === 0) {
        chatNew()
    }
}

//--------------------------------------------------------------
// Check if a chat has conversation
export function chatIsEmpty(chatId: string) {
    const chat = get(chats).find((chat) => chat.id === chatId)
    return chat ? chat.messages.length === 0 : false
}

//--------------------------------------------------------------
export function chatAddMessage(chatId: string, message: Message) {
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    messages: [...chat.messages, message],
                    updatedAt: new Date(),
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
export function chatDuplicate(chatId: string) {
    const chat = get(chats).find((chat) => chat.id === chatId)
    if (!chat) return

    const newChat = {
        ...chat,
        id: crypto.randomUUID(),
        title: chat.title + " (copy)",
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    chats.update(($chats) => [...$chats, newChat])
    activeChatId.set(newChat.id)
}

// In store initialization
const saved = localStorage.getItem("chats")
if (saved) {
    const parsed = JSON.parse(saved, (key, value) => {
        if (key === "createdAt" || key === "updatedAt" || key === "timestamp") {
            return new Date(value)
        }
        return value
    })
    chats.set(parsed)
}
