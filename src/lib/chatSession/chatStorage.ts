import { debounce } from "$lib/utils"
import { get } from "svelte/store"
import { appState } from "../appState/appState"
import { chatNew } from "./chatActions"
import { chats } from "./chatSession"
import { chatSessionStorage, unloadedChatIds } from "./chatSessionStorage"
import { mediaStorage } from "./mediaStorage"

// Function to validate and clean up media references
async function validateChatMedia() {
    try {
        const chatList = get(chats)
        const allChatIds = chatList.map((chat) => chat.id)

        // Clean up orphaned media first
        const cleanedUp = await mediaStorage.cleanupOrphanedMedia(allChatIds)
        if (cleanedUp > 0) {
            console.debug(
                `Cleaned up ${cleanedUp} orphaned media items during startup`
            )
        }
    } catch (error) {
        console.error("Failed to validate chat media:", error)
    }
}

// Ensure all messages have IDs (for backward compatibility with old saved chats)
function ensureMessageIds(chatList: any[]) {
    return chatList.map((chat) => ({
        ...chat,
        messages: (chat.messages || []).map((msg: any) => ({
            ...msg,
            id: msg.id || crypto.randomUUID(),
        })),
    }))
}

/**
 * Migrate existing localStorage chat data to IndexedDB.
 * Only runs once — sets a flag after successful migration.
 * Falls back to localStorage if migration fails.
 */
async function migrateFromLocalStorage(): Promise<boolean> {
    const saved = localStorage.getItem("chats")
    if (!saved) return false

    try {
        const parsedChats = ensureMessageIds(JSON.parse(saved))
        await chatSessionStorage.storeAllChats(parsedChats)

        // Verify migration by reading back
        const verified = await chatSessionStorage.getAllChats()
        if (verified.length !== parsedChats.length) {
            throw new Error(
                `Migration verification failed: expected ${parsedChats.length} chats, got ${verified.length}`
            )
        }

        // Migration succeeded — remove localStorage data and set flag
        localStorage.removeItem("chats")
        localStorage.setItem("chats_migrated", "1")
        console.debug(
            `Migrated ${parsedChats.length} chats from localStorage to IndexedDB`
        )

        // Load with lazy approach: only active chat gets messages
        const activeChatId = get(appState).activeChatId
        const lazified = parsedChats.map((chat: any) =>
            chat.id === activeChatId
                ? chat
                : { ...chat, messages: [] }
        )
        chats.set(lazified)
        return true
    } catch (e) {
        console.error("Migration to IndexedDB failed, using localStorage fallback:", e)
        try {
            const parsedChats = ensureMessageIds(JSON.parse(saved))
            chats.set(parsedChats)
            return true
        } catch (parseError) {
            console.error("Failed to parse localStorage chats:", parseError)
            return false
        }
    }
}

/**
 * Load chats from IndexedDB with lazy message loading.
 * Only the active chat's messages are loaded; others get empty arrays.
 */
async function loadFromIndexedDB(): Promise<boolean> {
    try {
        const storedChats = await chatSessionStorage.getAllChats()
        if (storedChats.length > 0) {
            const activeChatId = get(appState).activeChatId
            const lazified = ensureMessageIds(storedChats).map((chat: any) =>
                chat.id === activeChatId
                    ? chat
                    : { ...chat, messages: [] }
            )
            chats.set(lazified)
            return true
        }
        return false
    } catch (e) {
        console.error("Failed to load chats from IndexedDB:", e)
        return false
    }
}

/**
 * Unload messages for a chat from the store (they remain in IndexedDB).
 * Called when switching away from a chat to free memory.
 * Re-exported from chatSessionStorage for backward compat.
 */
export { loadChatMessages, unloadChatMessages, unloadedChatIds } from "./chatSessionStorage"

// Track previous chat IDs to detect additions/deletions
let previousChatIds: Set<string> = new Set()

/**
 * Efficient save: only writes changed/added chats and removes deleted ones.
 */
const debouncedSave = debounce(($chats: any[]) => {
    const currentIds = new Set($chats.map((c: any) => c.id))

    // Detect and remove deleted chats
    for (const id of previousChatIds) {
        if (!currentIds.has(id)) {
            chatSessionStorage.deleteChat(id).catch((e) =>
                console.error(`Failed to delete chat ${id} from IndexedDB:`, e)
            )
        }
    }

    // Save the active chat (covers ~99% of mutations)
    // Skip saving if the chat was just unloaded (empty messages due to lazy loading)
    const activeChatId = get(appState).activeChatId
    const activeChat = $chats.find((c: any) => c.id === activeChatId)
    if (activeChat && !unloadedChatIds.has(activeChatId)) {
        chatSessionStorage.storeChat(activeChat).catch((e) =>
            console.error(`Failed to save active chat to IndexedDB:`, e)
        )
    }

    // Save any newly added chats
    for (const id of currentIds) {
        if (!previousChatIds.has(id) && id !== activeChatId) {
            const chat = $chats.find((c: any) => c.id === id)
            if (chat) {
                chatSessionStorage.storeChat(chat).catch((e) =>
                    console.error(`Failed to save new chat ${id} to IndexedDB:`, e)
                )
            }
        }
    }

    previousChatIds = currentIds
}, 200)

// Initialize storage on startup
if (typeof window !== "undefined") {
    ; (async () => {
        let loaded = false

        // Check if we need to migrate from localStorage
        const needsMigration = localStorage.getItem("chats") !== null
        if (needsMigration) {
            loaded = await migrateFromLocalStorage()
        } else {
            loaded = await loadFromIndexedDB()
        }

        if (!loaded || get(chats).length === 0) {
            chatNew()
        }

        // Track initial IDs
        previousChatIds = new Set(get(chats).map((c) => c.id))

        // Setup auto-save to IndexedDB with debounce (200ms)
        chats.subscribe(debouncedSave)

        // Validate and clean up media after restoration
        setTimeout(validateChatMedia, 100)
    })()
}
