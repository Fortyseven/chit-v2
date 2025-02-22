import { appState } from "./appState"

export function appStateSetActiveChatId(id: string | String) {
    appState.update((state) => ({ ...state, activeChatId: id }))
}

export function appStateSetApiEndpoint(endpoint: string) {
    appState.update((state) => ({ ...state, apiEndpoint: endpoint }))
}
