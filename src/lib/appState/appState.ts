import { derived, writable } from "svelte/store"

export const DEFAULT_OL_ENDPOINT = "http://localhost:11434"

export interface AppState {
    activeChatId: String
    apiEndpoint: String
    soundEnabled: boolean
    defaultPrompt: string
}

export const appStateDefaults: AppState = {
    activeChatId: "", // will be initialized later
    apiEndpoint: DEFAULT_OL_ENDPOINT,
    soundEnabled: true,
    defaultPrompt: "",
}

export const appState = writable<AppState>({
    ...appStateDefaults,
})

export const appActiveChat = derived(appState, ($appState) => {
    return $appState.activeChatId
})
