//--------------------------------------------------------------
// Set tool call message visibility toggle
export function chatSetToolCallMessagesVisible(chatId: string = "", visible: boolean) {
    chatId = getActiveChatId(chatId)
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    toolCallMessagesVisible: visible,
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
// Update per-chat TTS settings (voice, rate, pitch)
export function chatSetTtsSettings(chatId: string = "", patch: Partial<ChatTTSSettings>) {
    chatId = getActiveChatId(chatId)
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    ttsSettings: { ...chat.ttsSettings, ...patch },
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
// Set tools enabled toggle
export function chatSetToolsEnabled(chatId: string = "", enabled: boolean) {
    chatId = getActiveChatId(chatId)
    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    toolsEnabled: enabled,
                }
            }
            return chat
        })
    )
}
import { get, writable } from "svelte/store"
import { z } from "zod"
import general_prompt from "../../preset-prompts/general.js"
import { appState } from "../appState/appState"
import { backpackProcess } from "../backpack/backpackActions"
import { llm } from "../llm/llm.js"
import {
    applySubPrompts,
    applySystemVariables,
    applyUserVariables,
} from "../templating/templating"
import { normalizeCharacters } from "../text/charNormalization"
import { estimateTokens } from "../text/tokenEstimate"
import { MediaAttachment } from "./chatAttachments"
import { mediaStorage } from "./mediaStorage"

import { GenericMessage } from "../llm/LLMDriver"
import { ttsMaybeAutoSpeak, ttsStop, voiceSettings } from "../voice/tts"
import {
    AppMode,
    BackpackMode,
    chats,
    ChatSession,
    ChatTTSSettings,
    currentChat,
    Message,
} from "./chatSession"
import { chatSessionStorage, loadChatMessages, unloadChatMessages, unloadedChatIds } from "./chatSessionStorage"
import { chatGenerateTitle } from "./chatTitler"
import {
    appendStreamingResponse,
    appendStreamingThoughts,
    resetStreamingState,
    setStreamingToolCallInfo,
    streamingState,
} from "./streamingState"

export const DEFAULT_CONTEXT = 65536
export const DEFAULT_TEMPERATURE = 0.7
export const DEFAULT_MODEL = "gemma3:12b"

// Scroll batching during streaming: track tokens to batch scroll updates
let tokensSinceLastScroll = 0
const SCROLL_BATCH_THRESHOLD = 10 // scroll every ~10 tokens to reduce layout thrashing

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
    const defaultThinking = get(appState).defaultThinking
    const defaultReasoningEffort = get(appState).defaultReasoningEffort
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
        subPrompts: [],
        response_buffer: "",
        hasThoughts: false,
        thinking_buffer: "",
        tool_call_info_buffer: "",
        isThinking: false,
        settings: {
            temperature: defaultTemperature,
            num_ctx: defaultContext,
            enable_thinking: defaultThinking,
            reasoning_effort: defaultReasoningEffort,
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
        toolCallMessagesVisible: true, // Default to visible
        toolsEnabled: false, // Default to disabled (opt-in)
        ttsSettings: {
            voice: get(voiceSettings).preferredVoice,
            rate: get(voiceSettings).rate,
            pitch: get(voiceSettings).pitch,
        },
    }

    chats.update(($chats) => [...$chats, newChat])

    // Unload previous chat's messages to free memory
    const previousChatId = get(appState).activeChatId
    if (previousChatId) {
        unloadChatMessages(previousChatId)
    }

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
// Add a new sub-prompt to the chat (enabled by default)
export function chatAddSubPrompt(chatId: string = ""): string {
    chatId = getActiveChatId(chatId)
    const id = crypto.randomUUID()

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    subPrompts: [
                        ...(chat.subPrompts || []),
                        { id, text: "", enabled: true },
                    ],
                }
            }
            return chat
        })
    )

    return id
}

//--------------------------------------------------------------
// Remove a sub-prompt from the chat
export function chatRemoveSubPrompt(
    chatId: string = "",
    subPromptId: string
) {
    chatId = getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    subPrompts: (chat.subPrompts || []).filter(
                        (sp) => sp.id !== subPromptId
                    ),
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
// Update the text of a sub-prompt
export function chatUpdateSubPromptText(
    chatId: string = "",
    subPromptId: string,
    text: string
) {
    chatId = getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    subPrompts: (chat.subPrompts || []).map((sp) =>
                        sp.id === subPromptId ? { ...sp, text } : sp
                    ),
                }
            }
            return chat
        })
    )
}

//--------------------------------------------------------------
// Toggle a sub-prompt on/off
export function chatToggleSubPrompt(
    chatId: string = "",
    subPromptId: string,
    enabled: boolean
) {
    chatId = getActiveChatId(chatId)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    subPrompts: (chat.subPrompts || []).map((sp) =>
                        sp.id === subPromptId ? { ...sp, enabled } : sp
                    ),
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
// Change the active chat (with lazy message loading)
export async function chatSwitchTo(chatId: string) {
    const currentId = get(appState).activeChatId
    if (currentId === chatId) return

    // Unload old chat's messages to free memory
    if (currentId) {
        unloadChatMessages(currentId)
    }

    // Load new chat's messages from IndexedDB
    await loadChatMessages(chatId)

    // Switch active chat
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

    // Clean up lazy loading state
    unloadedChatIds.delete(chatId)

    const wasActive = get(appState).activeChatId === chatId
    const deletedIndex = get(chats).findIndex((chat) => chat.id === chatId)

    chats.update(($chats) => $chats.filter((chat) => chat.id !== chatId))
    console.log("chatDelete", chatId)

    // there must always be one
    if (!get(chats).length) {
        chatNew()
    } else if (wasActive) {
        // Deleted chat was active — switch to the chat that takes its place
        const remaining = get(chats)
        await chatSwitchTo(remaining[Math.min(deletedIndex, remaining.length - 1)].id)
        // chatSwitchTo re-added the deleted id to unloadedChatIds — clean it up
        unloadedChatIds.delete(chatId)
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

    // If messages are unloaded (lazy loading), the chat is NOT empty
    if (unloadedChatIds.has(chatId)) return false

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
export async function chatDuplicate(chatId: string = "") {
    chatId = getActiveChatId(chatId)

    const chat = get(chats).find((chat) => chat.id === chatId)
    if (!chat) return

    const newChat = {
        ...chat,
        id: crypto.randomUUID(),
        title: chat.title + " (copy)",
        createdAt: new Date(),
    }

    // Save to IndexedDB first so chatSwitchTo can load messages
    await chatSessionStorage.storeChat(newChat as ChatSession)

    chats.update(($chats) => [...$chats, newChat])

    chatSwitchTo(newChat.id)
}

//--------------------------------------------------------------
/**
 * Fork the conversation at a specific message index.
 * Creates a new chat that is a copy of the current chat — including all
 * media blobs — but with the message list truncated to end at (and include)
 * the message at `messageIndex`. The new chat is saved to IndexedDB, added
 * to the chat list, and set as the active chat.
 *
 * Media blobs are re-keyed under the new chat id so the fork is fully
 * independent of the original: deleting the original chat will not destroy
 * the fork's media, and startup orphan-cleanup will not remove it.
 * @param chatId The chat ID to fork (defaults to active chat)
 * @param messageIndex The index of the message to fork at (inclusive)
 */
export async function chatForkAtMessage(chatId: string = "", messageIndex: number) {
    chatId = getActiveChatId(chatId)

    const chat = get(chats).find((chat) => chat.id === chatId)
    if (!chat) return

    // Guard against invalid indices (e.g. the streaming message renders with index -1)
    if (messageIndex < 0 || messageIndex >= chat.messages.length) return

    const newId = crypto.randomUUID()

    // Deep-copy the truncated message list so edits to the fork never alias
    // the original chat's message/media objects.
    const forkedMessages: Message[] = chat.messages
        .slice(0, messageIndex + 1)
        .map((msg) => ({
            ...msg,
            media: msg.media?.map((m) => ({ ...m })),
        }))

    const newChat = {
        ...chat,
        id: newId,
        title: chat.title + " (fork)",
        createdAt: new Date(),
        messages: forkedMessages,
        pastedMedia: [],
        // Reset transient/streaming state
        response_buffer: "",
        thinking_buffer: "",
        tool_call_info_buffer: "",
        hasThoughts: false,
        isThinking: false,
        wasAborted: false,
        scrollTop: undefined,
    }

    // Re-key media blobs under the new chat id. storeMedia is a put keyed by
    // blob id, so we must mint a new id per blob — reusing the original id
    // would overwrite the original chat's media record.
    try {
        const seen = new Set<string>()
        for (const msg of forkedMessages) {
            for (const m of msg.media || []) {
                if (!m.isStored || !m.blobId || seen.has(m.blobId)) continue
                seen.add(m.blobId)
                const blob = await mediaStorage.getMedia(m.blobId)
                if (!blob) continue
                const newBlobId = crypto.randomUUID()
                await mediaStorage.storeMedia(newBlobId, newId, blob, m.filename)
                m.blobId = newBlobId
            }
        }
    } catch (error) {
        console.error(`Failed to re-key media for fork ${newId}:`, error)
        // Continue — the fork still works; worst case a media item fails to load.
    }

    // Save to IndexedDB first so chatSwitchTo can load messages
    await chatSessionStorage.storeChat(newChat as ChatSession)

    chats.update(($chats) => [...$chats, newChat])

    await chatSwitchTo(newId)
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
/**
 * Rewind the conversation to a specific message index.
 * Removes the message at that index and all messages after it, returning the message content
 * that should be restored to the input box for editing.
 * @param chatId The chat ID (defaults to active chat)
 * @param messageIndex The index of the message to rewind to
 * @returns The message content that was rewound, or undefined if not found
 */
export function chatRewindToIndex(chatId: string = "", messageIndex: number): string | undefined {
    chatId = getActiveChatId(chatId)

    let rewoundContent: string | undefined = undefined

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                // Get the message at the specified index
                if (messageIndex >= 0 && messageIndex < chat.messages.length) {
                    rewoundContent = chat.messages[messageIndex].content
                    // Remove the message at this index and all messages after it
                    return {
                        ...chat,
                        messages: chat.messages.slice(0, messageIndex),
                    }
                }
            }
            return chat
        })
    )

    return rewoundContent
}

//--------------------------------------------------------------
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
    return get(streamingState).thinking_buffer
}
//--------------------------------------------------------------
export function chatGetStreamingPending(chatId: string = "") {
    return get(streamingState).response_buffer
}

//--------------------------------------------------------------
/**
 * Check if we should scroll during streaming based on token batching.
 * Returns true when enough tokens have accumulated since last scroll.
 */
export function chatShouldScrollDuringStream(): boolean {
    return tokensSinceLastScroll >= SCROLL_BATCH_THRESHOLD
}

/**
 * Reset the token counter after scrolling has occurred.
 * Called by PageContent when it performs a batched scroll.
 */
export function chatResetStreamScrollCounter(): void {
    tokensSinceLastScroll = 0
}

//--------------------------------------------------------------
export function chatAppendStreamingPending(
    chatId: string = "",
    fragment: string,
    isThinking: boolean
) {
    // console.log("chatAppendStreamingPending", { chatId, fragment, isThinking })

    chatId = getActiveChatId(chatId)

    // Normalize special characters from LLM output
    const normalizedFragment = normalizeCharacters(fragment)

    // Track tokens for scroll batching (only count response text, not thinking)
    if (!isThinking) {
        tokensSinceLastScroll += estimateTokens(normalizedFragment.length)
    }

    const tokenEstimate = estimateTokens(normalizedFragment.length)

    if (isThinking) {
        appendStreamingThoughts(normalizedFragment, tokenEstimate)
    } else {
        appendStreamingResponse(normalizedFragment, tokenEstimate)
    }
}

//--------------------------------------------------------------
/**
 * Set tool call info buffer for display in timeline (not sent to LLM)
 */
export function chatSetToolCallInfo(chatId: string = "", info: string) {
    setStreamingToolCallInfo(info)
}

//--------------------------------------------------------------
export async function chatPromoteStreamingPending(chatId: string = "") {
    chatId = getActiveChatId(chatId)

    // Reset scroll counter when promoting streaming content (response complete)
    tokensSinceLastScroll = 0

    const ss = get(streamingState)

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                const message: Message = {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: ss.response_buffer,
                    thoughts: ss.thinking_buffer,
                    timestamp: new Date(),
                }

                // Add tool call info if present (for display only, not sent to LLM)
                if (ss.tool_call_info_buffer && ss.tool_call_info_buffer.trim()) {
                    message.tool_call_info = ss.tool_call_info_buffer
                }

                // Add tool-generated media (e.g. generated images)
                if (ss.media_buffer && ss.media_buffer.length > 0) {
                    message.media = ss.media_buffer
                }

                return {
                    ...chat,
                    messages: [
                        ...chat.messages,
                        message,
                    ],
                    hasThoughts: ss.hasThoughts,
                    lastTokenCount: ss.lastTokenCount,
                    response_buffer: "",
                    thinking_buffer: "",
                    tool_call_info_buffer: "",
                    isThinking: false,
                }
            }
            return chat
        })
    )

    resetStreamingState()

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
    const ss = get(streamingState)
    return ss.thinking_buffer.length + ss.response_buffer.length > 0
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
    resetStreamingState()

    chats.update(($chats) =>
        $chats.map((chat) => {
            if (chat.id === chatId) {
                console.debug("chatStart", chatId)
                console.time("Inference Time")
                return {
                    ...chat,
                    lastRequestStart: Date.now(),
                    lastTokenCount: 0,
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
    } catch { }
}

// --------------------------------------------------------------
export function chatGetAllContents(): string | undefined {
    const curChat = get(currentChat)
    const sysPrompt = applySystemVariables(
        applyUserVariables(
            applySubPrompts(
                curChat?.systemPrompt || "",
                curChat?.subPrompts
            )
        )
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
            enable_thinking: false,
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

    resetStreamingState()
}
