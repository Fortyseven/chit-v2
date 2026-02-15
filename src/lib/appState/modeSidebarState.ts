import { writable } from "svelte/store"

const DEFAULT_WIDTH = 300
const SIDEBAR_WIDTH_KEY = "modeSidebarWidth"

// Initialize from localStorage or use default
let initialWidth = DEFAULT_WIDTH

if (typeof window !== "undefined") {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY)
    if (saved) {
        try {
            initialWidth = parseInt(saved, 10)
        } catch (e) {
            console.error("Failed to parse saved sidebar width from localStorage", e)
            initialWidth = DEFAULT_WIDTH
        }
    }
}

export const modeSidebarWidth = writable(initialWidth)

// Auto-save to localStorage
if (typeof window !== "undefined") {
    modeSidebarWidth.subscribe((width) => {
        localStorage.setItem(SIDEBAR_WIDTH_KEY, width.toString())
    })
}
