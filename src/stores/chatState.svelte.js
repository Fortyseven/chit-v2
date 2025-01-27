import { derived, get, writable } from "svelte/store"
// import app from "../main"
import { persisted } from "svelte-persisted-store"
// import { currentChatSessionIndex } from "./appState.svelte"
import { ChatSession } from "./ChatState/ChatSession.svelte"

const chatSessions = writable({
    sessions: [new ChatSession(), new ChatSession()],
})

function chatSessionCreate() {
    chatSessions.update((convos) => {
        convos.sessions.push(new ChatSession())
        return convos
    })
}

function chatSessionDelete(index) {
    chatSessions.update((convos) => {
        convos.sessions.splice(index, 1)
        return convos
    })
}

const currentChatSessionIndex = writable(0)

const setChatSessionIndex = (index) => {
    currentChatSessionIndex.set(index)
}

const currentChatSession = derived(
    [chatSessions, currentChatSessionIndex],
    ([$chatSessions, $currentChatSessionIndex]) => {
        return $chatSessions.sessions[$currentChatSessionIndex]
    }
)

export {
    chatSessionCreate,
    chatSessionDelete,
    chatSessions,
    currentChatSession,
    currentChatSessionIndex,
    setChatSessionIndex,
}
