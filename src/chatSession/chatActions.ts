import { get } from "svelte/store"
import llm from "../lib/llm/ollama"
import { appState } from "./appState"
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
    appState.update((state) => ({ ...state, activeChatId: id }))
}

//--------------------------------------------------------------
export function chatSetModel(chatId: String = "", modelName: string) {
    chatId = _getActiveChatId()

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
export function chatSetSystemPrompt(chatId: String = "", systemPrompt: string) {
    chatId = _getActiveChatId()

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
export function chatSwitchTo(chatId: String) {
    appState.update((state) => ({ ...state, activeChatId: chatId }))
    console.debug("Switching to chat", chatId)
    // activeChatId.set(chatId)
}

//--------------------------------------------------------------
// Delete a chat
export function chatDelete(chatId: String = "") {
    chatId = _getActiveChatId()

    chats.update(($chats) => $chats.filter((chat) => chat.id !== chatId))

    // there must always be one
    if (!get(chats).length) {
        chatNew()
    }
}

//--------------------------------------------------------------
// Check if a chat has conversation
export function chatIsEmpty(chatId: String = "") {
    chatId = _getActiveChatId()

    const chat = get(chats).find((chat) => chat.id === chatId)
    return chat ? chat.messages.length === 0 : false
}

//--------------------------------------------------------------
export function chatAddRoleMessage(
    chatId: String = "",
    role: "user" | "assistant",
    content: String
) {
    chatId = _getActiveChatId()

    const message = {
        content,
        role,
        timestamp: new Date(),
    }

    chatAddMessage(chatId, message)
}

//--------------------------------------------------------------
export function chatAddMessage(chatId: String = "", message: Message) {
    chatId = _getActiveChatId()

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
export function chatDuplicate(chatId: String = "") {
    chatId = _getActiveChatId()

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
export function chatFind(chatId: String = "") {
    chatId = _getActiveChatId()
    return get(chats).find((chat) => chat.id === chatId)
}

//--------------------------------------------------------------
export function chatChopLatest(chatId: String = ""): String {
    chatId = _getActiveChatId()
    // this is the entry before the one we're about to remove
    let chopped_prev = undefined

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                chopped_prev = chat.messages.slice(-1)[0].content
                return {
                    ...chat,
                    messages: chat.messages.slice(0, -1),
                    updatedAt: new Date(),
                }
            }
            return chat
        })
    )

    if (!chopped_prev) {
        throw new Error("Failed to chop latest message")
    }

    return chopped_prev
}

//--------------------------------------------------------------
export function chatBack(chatId: String = ""): String | undefined {
    // if most recent chat is of role assistant, remove it
    // then if the next most recent is of role user, return it

    chatId = _getActiveChatId()

    let chat = chatFind(chatId)

    if (!chat) {
        throw new Error("Chat not found: " + chatId)
    }

    const chopped = chatChopLatest(chatId)

    chat = chatFind(chatId)

    if (!chat || chat.messages.length === 0) {
        return undefined
    }

    if (chat.messages[chat.messages.length - 1].role === "user") {
        return chatChopLatest(chatId)
    }

    return chopped
}

//--------------------------------------------------------------
export function chatRunInference(chatId: String = "") {
    chatId = _getActiveChatId()
    get(llm).chatUpdateSession(chatId)
}

//--------------------------------------------------------------
export function chatLength(chatId: String = "") {
    chatId = _getActiveChatId()

    const chat = chatFind(chatId)
    return chat ? chat.messages.length : 0
}

//--------------------------------------------------------------
function _getActiveChatId(chatId: String = ""): String {
    return chatId || get(appState).activeChatId
}
