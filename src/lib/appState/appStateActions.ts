import { appState } from "./appState"

export function appStateSetActiveChatId(id: string | string) {
    appState.update((state) => ({ ...state, activeChatId: id }))
}

export function appStateSetChatApiEndpoint(endpoint: string) {
    appState.update((state) => ({ ...state, chatApiEndpoint: endpoint }))
}
export function appStateSetBackpackApiEndpoint(endpoint: string) {
    appState.update((state) => ({ ...state, backpackApiEndpoint: endpoint }))
}

export function appStateToggleSound(enabled: boolean) {
    appState.update((state) => ({ ...state, soundEnabled: enabled }))
}

export function appStateSetDefaultPrompt(prompt: string) {
    appState.update((state) => ({ ...state, defaultPrompt: prompt }))
}

export function appStateSetDefaultModel(model: string) {
    appState.update((state) => ({ ...state, defaultModel: model }))
}

export function appStateSetDefaultContext(context: string) {
    appState.update((state) => ({ ...state, defaultContext: context }))
}

export function appStateSetDefaultTemperature(temp: string) {
    appState.update((state) => ({ ...state, defaultTemperature: temp }))
}

export function appStateSetOpenAIBase(base: string) {
    appState.update((state) => ({ ...state, openaiApiBase: base }))
}
export function appStateSetOpenAIKey(key: string) {
    appState.update((state) => ({ ...state, openaiApiKey: key }))
}

export function appStateSetSelectedProvider(provider: "ollama" | "openai") {
    appState.update((state) => ({ ...state, selectedProvider: provider }))
}
