import { persisted } from "svelte-persisted-store"

export const DEFAULT_OL_ENDPOINT = "http://localhost:11434"

// these are for persistent application state, such as user settings
// on the Config page

export var configPersistState = persisted("config", {
    apiEndpoint: DEFAULT_OL_ENDPOINT,
    constrainChatWidth: false,
    useSfx: true,
})
