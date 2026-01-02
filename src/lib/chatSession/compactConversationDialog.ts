import { writable } from "svelte/store"

export type CompactConversationDialogState = {
    open: boolean
    chatId: string
    summary: string
}

export const compactConversationDialog = writable<CompactConversationDialogState>({
    open: false,
    chatId: "",
    summary: "",
})

export function openCompactConversationDialog(chatId: string, summary: string) {
    compactConversationDialog.set({
        open: true,
        chatId,
        summary,
    })
}

export function closeCompactConversationDialog() {
    compactConversationDialog.set({
        open: false,
        chatId: "",
        summary: "",
    })
}