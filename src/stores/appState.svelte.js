// these are for non-persistent application state, such as toggles, etc.

import { writable } from "svelte/store"

export const knobLock = $state({
    knobs: false,
    model: false,
    system: false,
})

// export const currentChatSessionIndex = writable(0)
export const selectedPresetIndex = writable(undefined)
