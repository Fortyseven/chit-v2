import { writable } from 'svelte/store'

// Store to signal that input text should be populated (used for rewind functionality)
export const pendingInputText = writable<string>('')

/**
 * Set pending input text that InputBar should populate
 */
export function setPendingInputText(text: string) {
    pendingInputText.set(text)
}

/**
 * Clear pending input text
 */
export function clearPendingInputText() {
    pendingInputText.set('')
}
