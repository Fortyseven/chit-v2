import { debounce } from "$lib/utils"
import { get } from "svelte/store"
import { chatNew } from "./chatActions"
import { chats } from "./chatSession"
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

        // TODO: Could add validation of media references within chats here
        // For now, we rely on the components to handle missing media gracefully
    } catch (error) {
        console.error("Failed to validate chat media:", error)
    }
}

// Ensure all messages have IDs (for backward compatibility with old saved chats)
function ensureMessageIds(chatList: any[]) {
    return chatList.map((chat) => ({
        ...chat,
        messages: chat.messages.map((msg: any) => ({
            ...msg,
            id: msg.id || crypto.randomUUID(),
        })),
    }))
}

// Restore from localStorage
if (typeof window !== "undefined") {
    const saved = localStorage.getItem("chats")

    // if we have existing chat content, try to restore it
    if (saved) {
        try {
            const parsedChats = JSON.parse(saved)
            const chatsWithIds = ensureMessageIds(parsedChats)
            chats.set(chatsWithIds)

            const c = get(chats)
            if (c.length == 0) {
                chatNew()
            }

            // Validate and clean up media after restoration
            setTimeout(validateChatMedia, 100) // Small delay to allow IndexedDB to initialize
        } catch (e) {
            console.error("Failed to parse saved chats from localStorage", e)
            chatNew()
        }
    } else {
        chatNew()
    }

    // Setup auto-save to localStorage with debounce (200ms)
    // This prevents excessive serialization during streaming
    const debouncedSave = debounce(($chats: any) => {
        localStorage.setItem("chats", JSON.stringify($chats))
    }, 200)

    chats.subscribe(debouncedSave)
}
