import { derived, writable } from "svelte/store"

export const DEFAULT_OL_ENDPOINT = "http://localhost:11434"
// export const DEFAULT_BP_ENDPOINT = "http://localhost:12434"
export const DEFAULT_BP_ENDPOINT = ""

export interface AppState {
    activeChatId: string
    chatApiEndpoint: string
    backpackApiEndpoint: string
    soundEnabled: boolean
    defaultPrompt: string
    defaultModel: string
    defaultContext: string // NEW: default context size (freeform)
    defaultTemperature: string // NEW: default temperature (freeform)
    backpackHeartbeatTimer: any
    useTitler: boolean
    resizeImages: boolean
    // NEW: OpenAI-compatible
    openaiApiBase: string
    openaiApiKey: string
}

export const appStateDefaults: AppState = {
    activeChatId: "", // will be initialized later
    chatApiEndpoint: DEFAULT_OL_ENDPOINT,
    backpackApiEndpoint: DEFAULT_BP_ENDPOINT,
    soundEnabled: true,
    defaultPrompt: "",
    defaultModel: "",
    defaultContext: "", // NEW: default context size
    defaultTemperature: "", // NEW: default temperature
    backpackHeartbeatTimer: null,
    useTitler: true,
    resizeImages: true,
    openaiApiBase: "",
    openaiApiKey: "",
}

export const appState = writable<AppState>({
    ...appStateDefaults,
})

export const appActiveChat = derived(appState, ($appState) => {
    return $appState.activeChatId
})
