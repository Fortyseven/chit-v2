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

// Restore from localStorage
if (typeof window !== "undefined") {
    const saved = localStorage.getItem("chats")

    // if we have existing chat content, try to restore it
    if (saved) {
        try {
            chats.set(JSON.parse(saved))

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

    // Setup auto-save to localStorage
    chats.subscribe(($chats) => {
        localStorage.setItem("chats", JSON.stringify($chats))
    })
}
