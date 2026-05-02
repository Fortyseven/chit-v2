import { derived, get, writable } from "svelte/store"
import { appState } from "$lib/appState/appState"

// Global store for thinking block open/closed states
// Persists across component recreations during streaming
const thinkingBlockStates = writable<Map<string, boolean>>(new Map())

export function createThinkingBlockStore(key: string) {
    return {
        subscribe: derived(
            [thinkingBlockStates, appState],
            ([$map, $appState]) => $map.get(key) ?? $appState.thinkBlockOpenByDefault
        ).subscribe,
        set: (value: boolean) => {
            thinkingBlockStates.update(map => {
                const newMap = new Map(map)
                newMap.set(key, value)
                return newMap
            })
        }
    }
}
