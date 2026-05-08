import { writable } from "svelte/store"

export const pendingResponse = writable({
    role: "assistant",
    content: "",
})

export const pendingContinuedAssistantChat = writable(false)

export const wasAborted = writable(false)
