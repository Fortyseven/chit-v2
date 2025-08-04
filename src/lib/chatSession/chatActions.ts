import { get, writable } from "svelte/store"
import { appState } from "../appState/appState"
import { backpackProcess } from "../backpack/backpackActions"
import llm from "../llm/ollama"
import {
    applySystemVariables,
    applyUserVariables,
} from "../templating/templating"
import { chatClearAllPastedMedia, MediaAttachment } from "./chatAttachments"
import {
    BackpackMode,
    chats,
    ChatSession,
    currentChat,
    Message,
} from "./chatSession"
import { chatGenerateTitle } from "./chatTitler"

export const DEFAULT_CONTEXT = 65536
export const DEFAULT_TEMPERATURE = 0.7
export const DEFAULT_MODEL = "gemma3:12b"

//--------------------------------------------------------------
// Insert a new chat at the end of the list
export function chatNew(): string {
    const id = crypto.randomUUID()
    const defaultModel = get(appState).defaultModel?.trim() || DEFAULT_MODEL
    const contextValue = get(appState).defaultContext?.trim()
    const defaultContext = contextValue && !isNaN(Number(contextValue)) ? Number(contextValue) : DEFAULT_CONTEXT
    const tempValue = get(appState).defaultTemperature?.trim()
    const defaultTemperature = tempValue && !isNaN(Number(tempValue)) ? Number(tempValue) : DEFAULT_TEMPERATURE
    const newChat = {
        id,
        title: "New Chat " + new Date().toLocaleString(),
        messages: [],
        createdAt: new Date(),
        lastRequestStart: 0,
        lastRequestFinish: 0,
        model_name: defaultModel,
        systemPrompt: get(appState).defaultPrompt,
        response_buffer: "",
        settings: {
            temperature: defaultTemperature,
            num_ctx: defaultContext,
        },
        wasAborted: false,
        pastedMedia: [],
        templateVariables: {
            user: "Human",
            assistant: "Assistant",
        },
        backpackMode: BackpackMode.OFF,
        backpackReferences: undefined,
    }

    chats.update(($chats) => [...$chats, newChat])
    appState.update((state) => ({ ...state, activeChatId: id }))

    return id
}

//--------------------------------------------------------------
export function chatSetModel(chatId: string = "", modelName: string) {
    chatId = getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    model_name: modelName,
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
// Set the system prompt
export function chatSetSystemPrompt(chatId: string, systemPrompt: string) {
    chatId = getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    systemPrompt: systemPrompt,
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
export function chatSetWasAborted(chatId: string = "", wasAborted: Boolean) {
    chatId = getActiveChatId(chatId)
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    wasAborted,
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
export function chatUpdateSettings(chatId: string = "", settings: any) {
    chatId = getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    settings: { ...(chat.settings || {}), ...settings },
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
// Change the active chat
export function chatSwitchTo(chatId: string) {
    appState.update((state) => ({ ...state, activeChatId: chatId }))
}

//--------------------------------------------------------------
// Delete a chat
export function chatDelete(chatId: string) {
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
export function chatIsEmpty(chatId: string) {
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
    chatId: string = "",
    role: "user" | "assistant",
    content: string,
    pastedMedia: MediaAttachment[] | undefined = undefined
) {
    chatId = getActiveChatId(chatId)

    const message: Message = {
        role,
        content,
        timestamp: new Date(),
    }

    if (pastedMedia) {
        message.media = pastedMedia.map((media) => ({
            ...media,
            // id: crypto.randomUUID(),
        }))
    }

    _chatAddMessage(chatId, message)
    chatClearAllPastedMedia(chatId)
}

//--------------------------------------------------------------
export function _chatAddMessage(chatId: string = "", message: Message) {
    chatId = getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    messages: [...chat.messages, message],
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
export function chatDuplicate(chatId: string = "") {
    chatId = getActiveChatId(chatId)

    const chat = get(chats).find((chat) => chat.id === chatId)
    if (!chat) return

    const newChat = {
        ...chat,
        id: crypto.randomUUID(),
        title: chat.title + " (copy)",
        createdAt: new Date(),
    }

    chats.update(($chats) => [...$chats, newChat])

    chatSwitchTo(newChat.id)
}

//--------------------------------------------------------------
export function chatFind(chatId: string = ""): ChatSession | undefined {
    chatId = getActiveChatId(chatId)
    return get(chats).find((chat) => chat.id === chatId)
}

//--------------------------------------------------------------
export function chatChopLatest(chatId: string = ""): string {
    chatId = getActiveChatId(chatId)
    // this is the entry before the one we're about to remove

    let chopped_prev_msg = ""

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                const chopped_prev = chat.messages.slice(-1)[0]
                chopped_prev_msg = chopped_prev.content
                const updated = {
                    ...chat,
                    messages: chat.messages.slice(0, -1),
                    pastedMedia: chopped_prev.media,
                }

                return updated
            }
            return chat
        })
    )

    return chopped_prev_msg
}

//--------------------------------------------------------------
export function chatBack(chatId: string = ""): string | undefined {
    // if most recent chat is of role assistant, remove it
    // then if the next most recent is of role user, return it

    chatId = getActiveChatId(chatId)

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
export async function chatRunInference(chatId: string = "") {
    chatId = getActiveChatId(chatId)

    // pass to backpack if present

    if (get(appState).backpackApiEndpoint) {
        // if we don't have a backpack mode, we'll still get
        // things like URLs resolution, etc.
        await backpackProcess(chatId)
    }

    get(llm).chatUpdateSession(chatId)
}

//--------------------------------------------------------------
export function chatLength(chatId: string = "") {
    chatId = getActiveChatId(chatId)

    const chat = chatFind(chatId)
    return chat ? chat.messages.length : 0
}

//--------------------------------------------------------------
export function chatGetStreamingPending(chatId: string = "") {
    chatId = getActiveChatId(chatId)

    const chat = chatFind(chatId)
    return chat ? chat.response_buffer : ""
}

//--------------------------------------------------------------
export function chatAppendStreamingPending(
    chatId: string = "",
    fragment: string
) {
    chatId = getActiveChatId(chatId)

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
export async function chatPromoteStreamingPending(chatId: string = "") {
    chatId = getActiveChatId(chatId)

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
                }
            }
            return chat
        })
    )

    // this is our first response?
    if (get(appState).useTitler && chatLength(chatId) == 2) {
        setTimeout(async () => {
            // if we're still sitting on a single user message or there's been more (that's fast!)
            if (chatLength(chatId) >= 2) {
                await chatGenerateTitle(chatId)
            }
        }, 2500)
    }
}

//--------------------------------------------------------------
export function chatSetTitle(chatId: string = "", title: string) {
    chatId = getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    title,
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
        const chatId = getActiveChatId()

        chatSetWasAborted(chatId, true)
    }
}

//--------------------------------------------------------------
export function chatInProgressWithId(chatId: string = ""): Boolean {
    chatId = getActiveChatId(chatId)

    const chat = chatFind(chatId)
    return chat ? chat.response_buffer.length > 0 : false
}

//--------------------------------------------------------------
export function chatClearConversation(chatId: string = "") {
    chatId = getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    messages: [],
                }
            }
            return chat
        })
    )
}

// --------------------------------------------------------------
export function chatStart(chatId: string = "") {
    chatId = getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    lastRequestStart: Date.now(),
                }
            }
            return chat
        })
    )
}

// --------------------------------------------------------------
export function chatFinish(chatId: string = "") {
    chatId = getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    lastRequestFinish: Date.now(),
                }
            }
            return chat
        })
    )
}

// --------------------------------------------------------------
export function chatGetAllContents(): string | undefined {
    const curChat = get(currentChat)
    const sysPrompt = applySystemVariables(
        applyUserVariables(curChat?.systemPrompt)
    )
    return (
        (sysPrompt ? sysPrompt + "\n\n----\n\n" : "") +
        curChat?.messages // .filter((msg) => msg.role === "assistant")
            .map((msg) =>
                msg.role === "user" ? "> " + msg.content : msg.content
            )
            .join("\n\n----\n\n")
    )
}

export function chatSetBackpackMode(mode: BackpackMode) {
    const chatId = getActiveChatId()
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    backpackMode: mode,
                }
            }
            return chat
        })
    )
}

export const chatInProgress = writable(false)

//--------------------------------------------------------------
export function getActiveChatId(chatId: string = ""): string {
    return chatId || get(appState).activeChatId
}
