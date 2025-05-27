import { get } from "svelte/store"
import { appState } from "../appState/appState"
import { chatFind, getActiveChatId } from "../chatSession/chatActions"
import { chats, currentChat } from "../chatSession/chatSession"

export async function backpackProcess(chatId: string) {
    const apiEndpoint = get(appState).backpackApiEndpoint
    const chat = chatFind(chatId)

    if (!chat) throw new Error("backpackProcess: Chat not found")

    // post rquest to apiendpoint

    if (!apiEndpoint) {
        console.error("backpackProcess: Backpack API endpoint is not set")
        return
    }
    console.log("🔧📦 Processing backpack for chatId:", chatId)
    console.log("🔧📦 Backpack API Endpoint:", apiEndpoint)

    let query_result

    let response = await fetch(`${apiEndpoint}/query`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ...chat,
            llm: {
                endpoint: get(appState).chatApiEndpoint,
            },
        }),
    })

    query_result = await response.json()

    updateBackpackReferences(chatId, query_result.response)

    console.log("BACKPACK", query_result.response)
}

function updateBackpackReferences(chatId: string, references: Array<any>) {
    chats.update(($chats) => {
        const chat = $chats.find((c) => c.id === chatId)
        if (chat) {
            chat.backpackReferences = references
        }
        return $chats
    })
}
