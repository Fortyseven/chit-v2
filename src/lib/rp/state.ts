// Core logic for RP story tracking: gating, state derivation from message
// history, and merge semantics for partial updates.
//
// State derivation: current state is the rp_state of the most recent
// message carrying one (scanning backward). Because rewind and backspace
// only remove messages from the tail, state reverts automatically when
// the conversation is trimmed — no extra bookkeeping needed.

import { AppMode, type ChatSession } from "../chatSession/chatSession"
import {
    DEFAULT_RP_TRACKING,
    type RPCharacter,
    type RPState,
} from "./types"

/** Shape accepted by rp_update_state (everything optional except character names). */
export interface RPPartialUpdate {
    title?: string
    location?: { name?: string; description?: string }
    characters?: Array<Partial<RPCharacter> & { name: string }>
    remove_characters?: string[]
    /** Full replacement of the notes field. */
    notes?: string
    /** Appended to existing notes (newline separated). */
    append_notes?: string
}

/**
 * Whether RP story tracking is active for this chat:
 * RP mode AND tools enabled AND the per-chat master toggle (default on).
 */
export function rpTrackingActive(
    chat: ChatSession | null | undefined
): boolean {
    if (!chat) return false
    if (chat.currentMode !== AppMode.RP) return false
    if (!chat.toolsEnabled) return false
    return chat.rpTracking?.enabled ?? DEFAULT_RP_TRACKING.enabled
}

/**
 * Whether the live STORY STATE block should be injected into the system
 * prompt (tracking active AND the injection toggle, default on).
 */
export function rpStateInjectionActive(
    chat: ChatSession | null | undefined
): boolean {
    if (!chat) return false
    if (!rpTrackingActive(chat)) return false
    return chat.rpTracking?.injectState ?? DEFAULT_RP_TRACKING.injectState
}

/**
 * Current tracked state for the chat: the rp_state of the most recent
 * message carrying one, or null if no state has been committed yet.
 */
export function getCurrentRPState(
    chat: ChatSession | null | undefined
): RPState | null {
    const messages = chat?.messages ?? []
    for (let i = messages.length - 1; i >= 0; i--) {
        const state = messages[i].rp_state
        if (state) return state
    }
    return null
}

function matchName(name: string, candidate: string): boolean {
    return candidate.trim().toLowerCase() === name.trim().toLowerCase()
}

/**
 * Upsert one character into a list by name (case-insensitive), merging
 * the provided fields over the existing entry. Stats merge per-key so a
 * partial stats object only overwrites the keys it names.
 */
function upsertCharacter(
    characters: RPCharacter[],
    patch: Partial<RPCharacter> & { name: string }
): RPCharacter[] {
    const existing = characters.find((c) => matchName(c.name, patch.name))
    if (!existing) {
        return [
            ...characters,
            {
                name: patch.name,
                description: patch.description ?? "",
                status: patch.status ?? "",
                inventory: patch.inventory ?? [],
                stats: patch.stats ?? {},
            },
        ]
    }
    const updated: RPCharacter = {
        ...existing,
        description: patch.description ?? existing.description,
        status: patch.status ?? existing.status,
        inventory: patch.inventory ?? existing.inventory,
        stats: { ...existing.stats, ...(patch.stats ?? {}) },
    }
    return characters.map((c) => (c === existing ? updated : c))
}

/**
 * Apply a partial update to the current state, returning the new full
 * state. The base must exist — rp_update_state errors when no scenario
 * has been started (rp_start_scenario initializes the record).
 */
export function applyPartialUpdate(
    base: RPState,
    update: RPPartialUpdate
): RPState {
    const current: RPState = base

    let location = current.location
    if (update.location) {
        location = {
            name: update.location.name ?? location.name,
            description:
                update.location.description ?? location.description,
        }
    }

    let characters = current.characters
    if (update.characters) {
        for (const patch of update.characters) {
            if (!patch.name || !patch.name.trim()) continue
            characters = upsertCharacter(characters, patch)
        }
    }
    if (update.remove_characters?.length) {
        const removed = update.remove_characters
        characters = characters.filter(
            (c) => !removed.some((name) => matchName(c.name, name))
        )
    }

    let notes = current.notes
    if (typeof update.append_notes === "string" && update.append_notes.trim()) {
        notes = notes ? `${notes}\n${update.append_notes.trim()}` : update.append_notes.trim()
    }
    if (update.notes !== undefined) {
        notes = update.notes
    }

    return {
        title: update.title ?? current.title,
        location,
        characters,
        notes,
    }
}
