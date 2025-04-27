import { appState } from "./appState"

export function appStateSetActiveChatId(id: string | String) {
    appState.update((state) => ({ ...state, activeChatId: id }))
}

export function appStateSetApiEndpoint(endpoint: string) {
    appState.update((state) => ({ ...state, apiEndpoint: endpoint }))
}

export function appStateToggleSound(enabled: boolean) {
    appState.update((state) => ({ ...state, soundEnabled: enabled }))
}

export function appStateSetDefaultPrompt(prompt: string) {
    appState.update((state) => ({ ...state, defaultPrompt: prompt }))
}
