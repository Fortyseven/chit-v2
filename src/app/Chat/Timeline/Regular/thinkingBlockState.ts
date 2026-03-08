import { derived, get, writable } from "svelte/store"

// Global store for thinking block open/closed states
// Persists across component recreations during streaming
const thinkingBlockStates = writable<Map<string, boolean>>(new Map())

export function createThinkingBlockStore(key: string) {
    return {
        subscribe: derived(thinkingBlockStates, $map => $map.get(key) ?? true).subscribe,
        set: (value: boolean) => {
            thinkingBlockStates.update(map => {
                const newMap = new Map(map)
                newMap.set(key, value)
                return newMap
            })
        }
    }
}
