// import { persisted } from "svelte-persisted-store"
// import { derived, get, writable } from "svelte/store"
// import { ChatSession } from "./ChatState/ChatSession.svelte"

// // ------------------------------------------

// const chatSessions = writable({
//     sessions: [new ChatSession(), new ChatSession()],
// })

// const currentChatSessionIndex = writable(0)

// const currentChatSession = derived(
//     [chatSessions, currentChatSessionIndex],
//     ([$chatSessions, $currentChatSessionIndex]) => {
//         return $chatSessions.sessions[$currentChatSessionIndex]
//     }
// )

// // ------------------------------------------

// function chatSessionCreate() {
//     chatSessions.update((convos) => {
//         convos.sessions.push(new ChatSession())
//         return convos
//     })
// }

// function chatSessionDelete(index) {
//     chatSessions.update((convos) => {
//         convos.sessions.splice(index, 1)
//         return convos
//     })
// }
// function setChatSessionIndex(index) {
//     currentChatSessionIndex.set(index)
// }

// export {
//     chatSessionCreate,
//     chatSessionDelete,
//     chatSessions,
//     currentChatSession,
//     currentChatSessionIndex,
//     setChatSessionIndex,
// }
