import { get, writable } from "svelte/store"
import { appState } from "../appState/appState"
import llm from "../llm/ollama"
import { ChatMediaType, chats, ChatSession, Message } from "./chatSession"
import { chatGenerateTitle } from "./chatTitler"

export const DEFAULT_CONTEXT = 65536
export const DEFAULT_TEMPERATURE = 0.6

//--------------------------------------------------------------
// Insert a new chat at the end of the list
export function chatNew(): String {
    const id = crypto.randomUUID()
    const newChat = {
        id,
        title: "New Chat " + new Date().toLocaleString(),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        model_name: "gemma3:12b",
        system_prompt: get(appState).defaultPrompt,
        response_buffer: "",
        settings: {
            temperature: DEFAULT_TEMPERATURE,
            num_ctx: DEFAULT_CONTEXT,
        },
        wasAborted: false,
        pastedMedia: undefined,
    }

    chats.update(($chats) => [...$chats, newChat])
    appState.update((state) => ({ ...state, activeChatId: id }))

    return id
}

//--------------------------------------------------------------
export function chatSetModel(chatId: String = "", modelName: string) {
    chatId = _getActiveChatId(chatId)

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
export function chatSetSystemPrompt(chatId: String, systemPrompt: String) {
    chatId = _getActiveChatId(chatId)

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
export function chatSetWasAborted(chatId: String = "", wasAborted: Boolean) {
    chatId = _getActiveChatId(chatId)
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    wasAborted,
                    updatedAt: new Date(),
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
export function chatUpdateSettings(chatId: String = "", settings: any) {
    chatId = _getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    settings: { ...(chat.settings || {}), ...settings },
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
}

//--------------------------------------------------------------
// Delete a chat
export function chatDelete(chatId: String) {
    if (!chatId) {
        alert("BUG: chatDelete: chatId was empty")
        throw new Error("chatDelete: chatId is required")
    }

    chats.update(($chats) => $chats.filter((chat) => chat.id !== chatId))
    console.log("chatDelete", chatId)

    // there must always be one
    if (!get(chats).length) {
        chatNew()
    }
}

//--------------------------------------------------------------
// Check if a chat has conversation
export function chatIsEmpty(chatId: String) {
    if (!chatId) {
        // FIXME: I'm being obnoxious here because a couple times I had
        // this happen and I want to know why.
        alert("BUG: chatIsEmpty: chatId was empty")
        throw new Error("chatIsEmpty: chatId is required")
    }

    const chat = get(chats).find((chat) => chat.id === chatId)
    return chat ? chat.messages.length === 0 : false
}

//--------------------------------------------------------------
export function chatAddRoleMessage(
    chatId: String = "",
    role: "user" | "assistant",
    content: String,
    pastedMedia: Blob | undefined = undefined
) {
    chatId = _getActiveChatId(chatId)

    const message: Message = {
        role,
        content,
        timestamp: new Date(),
    }

    if (pastedMedia && pastedMedia.size > 0) {
        message.media = pastedMedia
    }

    _chatAddMessage(chatId, message)
    chatClearPastedMedia(chatId)
}

//--------------------------------------------------------------
export function _chatAddMessage(chatId: String = "", message: Message) {
    chatId = _getActiveChatId(chatId)

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
    chatId = _getActiveChatId(chatId)

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

    chatSwitchTo(newChat.id)
}

//--------------------------------------------------------------
export function chatFind(chatId: String = ""): ChatSession | undefined {
    chatId = _getActiveChatId(chatId)
    return get(chats).find((chat) => chat.id === chatId)
}

//--------------------------------------------------------------
export function chatChopLatest(chatId: String = ""): String | undefined {
    chatId = _getActiveChatId(chatId)
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

    return chopped_prev
}

//--------------------------------------------------------------
export function chatBack(chatId: String = ""): String | undefined {
    // if most recent chat is of role assistant, remove it
    // then if the next most recent is of role user, return it

    chatId = _getActiveChatId(chatId)

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

    return undefined
}

//--------------------------------------------------------------
export function chatRunInference(chatId: String = "") {
    chatId = _getActiveChatId(chatId)
    get(llm).chatUpdateSession(chatId)
}

//--------------------------------------------------------------
export function chatLength(chatId: String = "") {
    chatId = _getActiveChatId(chatId)

    const chat = chatFind(chatId)
    return chat ? chat.messages.length : 0
}

//--------------------------------------------------------------
export function chatGetStreamingPending(chatId: String = "") {
    chatId = _getActiveChatId(chatId)

    const chat = chatFind(chatId)
    return chat ? chat.response_buffer : ""
}

//--------------------------------------------------------------
export function chatAppendStreamingPending(
    chatId: String = "",
    fragment: String
) {
    chatId = _getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    response_buffer: ((chat.response_buffer as string) +
                        fragment) as string,
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
export async function chatPromoteStreamingPending(chatId: String = "") {
    chatId = _getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    messages: [
                        ...chat.messages,
                        {
                            role: "assistant",
                            content: chat.response_buffer as string,
                            timestamp: new Date(),
                        },
                    ],
                    response_buffer: "",
                    updatedAt: new Date(),
                }
            }
            return chat
        })
    )
    // this is our first response?
    if (chatLength(chatId) == 2) {
        // user -> assistant
        await chatGenerateTitle(chatId)
    }
}

//--------------------------------------------------------------
export function chatSetPastedMedia(
    chatId: String = "",
    data: Blob | undefined
) {
    chatId = _getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    pastedMedia: data,
                    updatedAt: new Date(),
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
export function chatClearPastedMedia(chatId: String = "") {
    chatSetPastedMedia(chatId, undefined)
}

//--------------------------------------------------------------
export function chatSetTitle(chatId: String = "", title: String) {
    chatId = _getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    title,
                    updatedAt: new Date(),
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
export function chatAbort() {
    // check if we're running inference
    if (!get(chatInProgress)) {
        return
    }

    try {
        get(get(llm).ol_instance).abort()
    } catch (e) {
        // console.info("Chat aborted:", e)
    } finally {
        const chatId = _getActiveChatId()

        chatSetWasAborted(chatId, true)
    }
}

//--------------------------------------------------------------
export function chatInProgressWithId(chatId: String = ""): Boolean {
    chatId = _getActiveChatId(chatId)

    const chat = chatFind(chatId)
    return chat ? chat.response_buffer.length > 0 : false
}

//--------------------------------------------------------------
export function chatClearConversation(chatId: String = "") {
    chatId = _getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    messages: [],
                    updatedAt: new Date(),
                }
            }
            return chat
        })
    )
}

export const chatInProgress = writable(false)

//--------------------------------------------------------------
function _getActiveChatId(chatId: String = ""): String {
    return chatId || get(appState).activeChatId
}
