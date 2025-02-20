import { appState } from "./appState"

export function appStateSetActiveChatId(id: string | String) {
    appState.update((state) => ({ ...state, activeChatId: id }))
}
