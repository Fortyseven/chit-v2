import { writable } from "svelte/store"

/** Open state for the RP story tracking settings dialog (RP mode panel). */
export const rpSettingsDialogOpen = writable(false)
