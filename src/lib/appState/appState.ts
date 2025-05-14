import { derived, writable } from "svelte/store"

export const DEFAULT_OL_ENDPOINT = "http://localhost:11434"
// export const DEFAULT_BP_ENDPOINT = "http://localhost:12434"
export const DEFAULT_BP_ENDPOINT = ""

export interface AppState {
    activeChatId: String
    chatApiEndpoint: String
    backpackApiEndpoint: String
    soundEnabled: boolean
    defaultPrompt: string
    backpackHeartbeatTimer: any
}

export const appStateDefaults: AppState = {
    activeChatId: "", // will be initialized later
    chatApiEndpoint: DEFAULT_OL_ENDPOINT,
    backpackApiEndpoint: DEFAULT_BP_ENDPOINT,
    soundEnabled: true,
    defaultPrompt: "",
    backpackHeartbeatTimer: null,
}

export const appState = writable<AppState>({
    ...appStateDefaults,
})

export const appActiveChat = derived(appState, ($appState) => {
    return $appState.activeChatId
})
