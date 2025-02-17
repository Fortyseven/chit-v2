//--------------------------------------------------------------

import { get } from "svelte/store"
import { chatNew } from "./chatActions"
import { activeChatId, chats } from "./chatSession"

// Restore from localStorage
if (typeof window !== "undefined") {
    const saved = localStorage.getItem("chats")
    if (saved) {
        chats.set(JSON.parse(saved))

        const c = get(chats)
        if (c.length > 0) {
            activeChatId.set(c[0].id)
        } else {
            chatNew()
        }
    } else {
        chatNew()
    }

    // const saved = localStorage.getItem("chats")

    // if (saved) {
    //     const parsed = JSON.parse(saved, (key, value) => {
    //         if (
    //             key === "createdAt" ||
    //             key === "updatedAt" ||
    //             key === "timestamp"
    //         ) {
    //             return new Date(value)
    //         }
    //         return value
    //     })
    //     chats.set(parsed)
    // }

    // Auto-save to localStorage
    chats.subscribe(($chats) => {
        localStorage.setItem("chats", JSON.stringify($chats))
    })
}

// populateTestData()

console.log("chats", get(chats))
