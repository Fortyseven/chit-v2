// Types for RP story tracking: a structured, per-message-recorded state
// that the LLM maintains via tools while roleplaying.

/**
 * A character in a tracked RP scenario.
 *
 * `name` and `description` are the only fixed fields; everything else
 * numeric/fiction-specific lives in the free-form `stats` map. Add or
 * remove suggested default keys in SUGGESTED_STAT_KEYS below.
 */
export interface RPCharacter {
    name: string
    description: string
    /** Brief current state, e.g. "wounded, hiding in the cellar, wary of Bryn". */
    status: string
    inventory: string[]
    /** Free-form stat fields, e.g. { hp: 40, max_hp: 100, level: 3 }. */
    stats: Record<string, any>
}

/**
 * The canonical tracked state of a RP scenario.
 * A full snapshot of this lives on each assistant message that committed
 * a state change (Message.rp_state), which is what makes rewind/chop
 * restore state automatically.
 */
export interface RPState {
    title: string
    location: {
        name: string
        description: string
    }
    characters: RPCharacter[]
    /** Ongoing plot notes, unresolved threads. */
    notes: string
}

/**
 * Per-chat RP tracking settings. Unset fields fall back to defaults
 * (tracking on, state injection on) when RP mode and tools are active.
 */
export interface RPTrackingSettings {
    /** Master switch for story tracking (still requires RP mode + tools). */
    enabled: boolean
    /** Include the live STORY STATE block in the system prompt each turn. */
    injectState: boolean
}

/** Defaults applied when ChatSession.rpTracking is unset. */
export const DEFAULT_RP_TRACKING: RPTrackingSettings = {
    enabled: true,
    injectState: true,
}

/**
 * Suggested default stat keys for the protocol prompt (and any future
 * UI ordering). Edit freely: these are suggestions, not a schema — the
 * model may use any keys the fiction needs.
 */
export const SUGGESTED_STAT_KEYS = ["hp", "max_hp", "stamina", "mood", "level"]
