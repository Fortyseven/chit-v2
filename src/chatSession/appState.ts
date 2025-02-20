import { derived, get, writable, type Readable } from "svelte/store"

export const DEFAULT_OL_ENDPOINT = "http://localhost:11434"

export interface AppState {
    activeChatId: String
    apiEndpoint: String
}

export const appStateDefaults: AppState = {
    activeChatId: "", // will be initialized later
    apiEndpoint: DEFAULT_OL_ENDPOINT,
}

export const appState = writable<AppState>({
    ...appStateDefaults,
})

export const appActiveChat = derived(appState, ($appState) => {
    return $appState.activeChatId
})
