import type { ReasoningEffort } from "../chatSession/chatSession"
import { appState } from "./appState"

export function appStateSetBackpackApiEndpoint(endpoint: string) {
    appState.update((state) => ({ ...state, backpackApiEndpoint: endpoint }))
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

export function appStateSetDefaultThinking(thinking: boolean) {
    appState.update((state) => ({ ...state, defaultThinking: thinking }))
}

export function appStateSetDefaultReasoningEffort(effort: ReasoningEffort) {
    appState.update((state) => ({ ...state, defaultReasoningEffort: effort }))
}

export function appStateSetThinkBlockOpenByDefault(open: boolean) {
    appState.update((state) => ({ ...state, thinkBlockOpenByDefault: open }))
}

export function appStateSetOpenAIBase(base: string) {
    appState.update((state) => ({ ...state, openaiApiBase: base }))
}
export function appStateSetOpenAIKey(key: string) {
    appState.update((state) => ({ ...state, openaiApiKey: key }))
}
export function appStateSetModalityBase(base: string) {
    appState.update((state) => ({ ...state, modalityApiBase: base }))
}
export function appStateSetModalityKey(key: string) {
    appState.update((state) => ({ ...state, modalityApiKey: key }))
}
export function appStateSetModalityModel(model: string) {
    appState.update((state) => ({ ...state, modalityModel: model }))
}
export function appStateSetMediaServerUrl(url: string) {
    appState.update((state) => ({ ...state, mediaServerUrl: url }))
}
