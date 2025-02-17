// these are for non-persistent application state, such as toggles, etc.

import { writable } from "svelte/store"

export const DEFAULT_OL_ENDPOINT = "http://localhost:11434"

export const knobLock = writable({
    knobs: false,
    model: false,
    system: false,
})

export const selectedPresetIndex = writable(undefined)

export const appState = writable({
    apiEndpoint: DEFAULT_OL_ENDPOINT,
    constrainChatWidth: false,
    useSfx: true,
})
