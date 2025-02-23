import { appState, appStateDefaults } from "./appState"

const APP_LS_KEY = "chitAppState"

// Restore from localStorage
if (typeof window !== "undefined") {
    const saved = localStorage.getItem(APP_LS_KEY)

    if (saved) {
        try {
            appState.set(JSON.parse(saved))
        } catch (e) {
            console.error("Failed to parse saved chats from localStorage", e)
            appState.set({ ...appStateDefaults })
        }
    }

    // Setup auto-save to localStorage
    appState.subscribe(($appState) => {
        localStorage.setItem(APP_LS_KEY, JSON.stringify($appState))
    })
}
