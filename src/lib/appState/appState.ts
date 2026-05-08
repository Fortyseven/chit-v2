import { derived, writable } from "svelte/store"
import type { MCPServerConfig } from "../mcp/types"

// export const DEFAULT_BP_ENDPOINT = "http://localhost:12434"
export const DEFAULT_BP_ENDPOINT = ""

export interface AppState {
    activeChatId: string
    backpackApiEndpoint: string
    soundEnabled: boolean
    defaultPrompt: string
    defaultModel: string
    defaultContext: string // NEW: default context size (freeform)
    defaultTemperature: string // NEW: default temperature (freeform)
    defaultThinking: boolean // NEW: default thinking mode
    thinkBlockOpenByDefault: boolean
    backpackHeartbeatTimer: any
    useTitler: boolean
    resizeImages: boolean
    // NEW: OpenAI-compatible
    openaiApiBase: string
    openaiApiKey: string
    mcpServers: MCPServerConfig[]
}

export const appStateDefaults: AppState = {
    activeChatId: "", // will be initialized later
    backpackApiEndpoint: DEFAULT_BP_ENDPOINT,
    soundEnabled: true,
    defaultPrompt: "",
    defaultModel: "",
    defaultContext: "", // NEW: default context size
    defaultTemperature: "", // NEW: default temperature
    defaultThinking: true, // NEW: default thinking mode
    thinkBlockOpenByDefault: false,
    backpackHeartbeatTimer: null,
    useTitler: true,
    resizeImages: true,
    openaiApiBase: "",
    openaiApiKey: "",
    mcpServers: [],
}

export const appState = writable<AppState>({
    ...appStateDefaults,
})

export const appActiveChat = derived(appState, ($appState) => {
    return $appState.activeChatId
})
