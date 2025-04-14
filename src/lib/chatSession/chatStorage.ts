import { get } from "svelte/store"
import { chatNew } from "./chatActions"
import { chats } from "./chatSession"

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
