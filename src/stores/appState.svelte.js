import { persisted } from "svelte-persisted-store"
import { DEFAULT_OL_ENDPOINT } from "../lib/llm/ollama.svelte"

// these are for non-persistent application state, such as toggles, etc.

export const appState = $state({
    lock: {
        knobs: false,
        model: false,
        system: false,
    },
    selectedPresetIndex: undefined,
})

// these are for persistent application state, such as user settings
// on the Config page

export var configValues = persisted("config", {
    apiEndpoint: DEFAULT_OL_ENDPOINT,
    constrainChatWidth: false,
    useSfx: true,
})
