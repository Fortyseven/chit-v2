import { get, writable } from "svelte/store"
import { z } from "zod"
import general_prompt from "../../preset-prompts/general.js"
import { appState } from "../appState/appState"
import { backpackProcess } from "../backpack/backpackActions"
import { llm } from "../llm/llm.js"
import {
    applySystemVariables,
    applyUserVariables,
} from "../templating/templating"
import { MediaAttachment } from "./chatAttachments"
import { mediaStorage } from "./mediaStorage"

import { GenericMessage } from "../llm/LLMDriver"
import { ttsMaybeAutoSpeak, ttsStop } from "../voice/tts"
import {
    AppMode,
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
    const defaultContext =
        contextValue && !isNaN(Number(contextValue))
            ? Number(contextValue)
            : DEFAULT_CONTEXT
    const tempValue = get(appState).defaultTemperature?.trim()
    const defaultTemperature =
        tempValue && !isNaN(Number(tempValue))
            ? Number(tempValue)
            : DEFAULT_TEMPERATURE
    const newChat = {
        id,
        title: "New Chat " + new Date().toLocaleString(),
        messages: [],
        createdAt: new Date(),
        lastRequestStart: 0,
        lastRequestTimer: 0,
        lastTokenCount: 0,
        model_name: defaultModel,
        systemPrompt: get(appState).defaultPrompt || general_prompt.prompt,
        response_buffer: "",
        hasThoughts: false,
        thinking_buffer: "",
        isThinking: false,
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
        currentMode: AppMode.DEFAULT,
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
export async function chatDelete(chatId: string) {
    if (!chatId) {
        alert("BUG: chatDelete: chatId was empty")
        throw new Error("chatDelete: chatId is required")
    }

    // Clean up media from IndexedDB first - this will clean up ALL media for this chat
    try {
        await mediaStorage.deleteChatMedia(chatId)
        console.debug(`Cleaned up media for deleted chat ${chatId}`)
    } catch (error) {
        console.error(`Failed to clean up media for chat ${chatId}:`, error)
        // Continue with chat deletion even if media cleanup fails
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
export async function chatAddRoleMessage(
    chatId: string = "",
    role: "user" | "assistant" | "system",
    content: string,
    pastedMedia: MediaAttachment[] | undefined = undefined
) {
    chatId = getActiveChatId(chatId)

    const message: Message = {
        id: crypto.randomUUID(),
        role,
        content,
        timestamp: new Date(),
    }

    if (pastedMedia) {
        message.media = pastedMedia.map((media) => ({
            ...media,
        }))
    }

    _chatAddMessage(chatId, message)

    // Clear pasted media references but don't delete from IndexedDB
    // since the message now owns the media
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    pastedMedia: [], // Clear the references only
                }
            }
            return chat
        })
    )
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

/**
 * Run inference on the active (or indicated) chat, passing the current messages
 * state to the LLM driver.
 * @param chatId
 */
export async function chatRunInference(chatId: string = "") {
    chatId = getActiveChatId(chatId)

    ttsStop()

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
export function chatGetStreamingPendingThoughts(chatId: string = "") {
    chatId = getActiveChatId(chatId)

    const chat = chatFind(chatId)
    return chat ? chat.thinking_buffer : ""
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
    fragment: string,
    isThinking: boolean
) {
    chatId = getActiveChatId(chatId)

    if (isThinking) {
        chats.update(($chats) =>
            $chats.map((chat: ChatSession) => {
                if (chat.id === chatId) {
                    chat.isThinking = true
                    chat.hasThoughts = true
                    chat.lastTokenCount += fragment.length
                    return {
                        ...chat,
                        thinking_buffer: ((chat.thinking_buffer as string) +
                            fragment) as string,
                    }
                }
                return chat
            })
        )
    } else {
        chats.update(($chats) =>
            $chats.map((chat: ChatSession) => {
                if (chat.id === chatId) {
                    chat.isThinking = false
                    chat.lastTokenCount += fragment.length
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
                            id: crypto.randomUUID(),
                            role: "assistant",
                            content: chat.response_buffer as string,
                            thoughts: chat.thinking_buffer as string,
                            timestamp: new Date(),
                        },
                    ],
                    response_buffer: "",
                    thinking_buffer: "",
                    isThinking: false,
                }
            }
            return chat
        })
    )

    // Auto-speak if enabled
    try {
        ttsMaybeAutoSpeak()
    } catch (e) {
        console.warn("TTS auto-speak failed", e)
    }

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
    ttsStop()

    // check if we're running inference
    if (!get(chatInProgress)) {
        return
    }

    try {
        const driverStore = get(llm).driver
        const driver = driverStore && get(driverStore)
        if (driver) {
            if (typeof driver.abort === "function") {
                driver.abort()
            }
        }
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
    return chat
        ? chat.thinking_buffer?.length + chat.response_buffer?.length > 0
        : false
}

//--------------------------------------------------------------
export async function chatClearConversation(chatId: string = "") {
    chatId = getActiveChatId(chatId)

    ttsStop()

    // Clean up media from IndexedDB when clearing conversation - this will clean up ALL media for this chat
    try {
        await mediaStorage.deleteChatMedia(chatId)
        console.debug(`Cleaned up media for cleared chat ${chatId}`)
    } catch (error) {
        console.error(`Failed to clean up media for chat ${chatId}:`, error)
        // Continue with conversation clearing even if media cleanup fails
    }

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    messages: [],
                    pastedMedia: [], // Also clear in-memory media references
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
export function chatClearConversationKeepMedia(chatId: string = "") {
    chatId = getActiveChatId(chatId)

    ttsStop()

    // Clear messages but keep media attachments
    // Collect all media from all messages and put them back into pastedMedia
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                // Collect all media from all messages
                const allMedia: MediaAttachment[] = []

                // Add any media currently in pastedMedia (not yet attached to messages)
                if (chat.pastedMedia) {
                    allMedia.push(...chat.pastedMedia)
                }

                // Extract media from all messages
                chat.messages.forEach((message) => {
                    if (message.media) {
                        allMedia.push(...message.media)
                    }
                })

                return {
                    ...chat,
                    messages: [],
                    pastedMedia: allMedia,
                }
            }
            return chat
        })
    )
}

// --------------------------------------------------------------
export function chatStart(chatId: string = "") {
    chatId = getActiveChatId(chatId)
    ttsStop()

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                console.debug("chatStart", chatId)
                console.time("Inference Time")
                return {
                    ...chat,
                    lastRequestStart: Date.now(),
                    lastTokenCount: 0, // reset per-stream to avoid cumulative CPS inflation
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
                console.timeEnd("Inference Time")
                return {
                    ...chat,
                    lastRequestTimer: Date.now(), // Only update here
                }
            }
            return chat
        })
    )

    // If the buffer has already been promoted earlier, optionally re-trigger auto-speak (harmless duplicate safety)
    try {
        // Only speak if not currently speaking.
        // Import done above; guard to avoid double start mid-stream.
        // We rely on promoteStreamingPending for main trigger.
    } catch {}
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

// --------------------------------------------------------------
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

// --------------------------------------------------------------
export function chatSetCurrentMode(mode: AppMode, chatId: string = "") {
    chatId = getActiveChatId(chatId)
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    currentMode: mode,
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

//--------------------------------------------------------------
const COMPACT_SYSTEM_PROMPT = `You will be provided the context of an LLM context. Your goal is to compact this context so we can continue the conversation. The best compaction will capture the key details, intent, code blocks, context, and important information from the context. ONLY return the content of the new, compacted context.`

export async function chatGenerateSummary(
    chatId: string = ""
): Promise<string> {
    chatId = getActiveChatId(chatId)
    const chat_session: ChatSession | undefined = chatFind(chatId)
    const _llm = get(llm)

    if (!chat_session) {
        throw new Error("chatGenerateSummary: chat session not found")
    }

    if (chat_session.messages.length === 0) {
        throw new Error("chatGenerateSummary: no messages to summarize")
    }

    const llm_instance = get(_llm.driver)

    if (!llm_instance) {
        throw new Error("chatGenerateSummary: llm instance not found")
    }

    const conversation = chat_session.messages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n")

    const messages: GenericMessage[] = [
        {
            role: "system",
            content: COMPACT_SYSTEM_PROMPT,
        },
        {
            role: "user",
            content: conversation,
        },
    ]

    const cur_context = chat_session.settings?.num_ctx || DEFAULT_CONTEXT

    const SummaryResponse = z.object({
        compressed_context: z.string(),
    })

    const response = await llm_instance.chat(
        null,
        messages,
        chat_session.model_name,
        {
            stream: false,
            temp: 0.4,
            ctx: cur_context,
        }
    )

    return response || "[No summary generated]"
}

export async function chatCompactConversation(
    chatId: string = "",
    summaryText: string
) {
    chatId = getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                const compactMessage: Message = {
                    id: crypto.randomUUID(),
                    role: "system",
                    content: `[Previous conversation summary]\n\n${summaryText}`,
                    timestamp: new Date(),
                }

                return {
                    ...chat,
                    messages: [compactMessage],
                    response_buffer: "",
                    thinking_buffer: "",
                    hasThoughts: false,
                    isThinking: false,
                }
            }
            return chat
        })
    )
}
