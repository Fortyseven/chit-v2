import { get } from "svelte/store"
import llm from "../lib/llm/ollama"
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
        model_name: "llama3.1:latest",
        system_prompt: "",
        response_buffer: "",
    }

    chats.update(($chats) => [...$chats, newChat])
    activeChatId.set(id)
}

//--------------------------------------------------------------
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

//--------------------------------------------------------------
// Set the system prompt
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
    if (!get(chats).length) {
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
export function chatAddRoleMessage(
    chatId: String,
    role: "user" | "assistant",
    content: String
) {
    const message = {
        content,
        role,
        timestamp: new Date(),
    }

    chatAddMessage(chatId, message)
}

//--------------------------------------------------------------
export function chatAddMessage(chatId: String, message: Message) {
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
export function chatDuplicate(chatId: String) {
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

//--------------------------------------------------------------
export function chatFind(chatId: String) {
    return get(chats).find((chat) => chat.id === chatId)
}

//--------------------------------------------------------------
export function chatBack(chatId: String): Message | undefined {
    // if most recent chat is of role assistant, remove it
    // then if the next most recent is of role user, return it
    console.log("chatBack", chatId)

    // pop the last message

    const chat = chatFind(chatId)
    if (!chat) {
        throw new Error("Chat not found: " + chatId)
    }

    const messages = [...chat.messages]
    const popped = messages.pop()

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    messages: messages,
                    updatedAt: new Date(),
                }
            }
            return chat
        })
    )
    return popped
}

//--------------------------------------------------------------
export function chatRunInference(chatId: String) {
    get(llm).chatUpdateSession(chatId)
}
