// System-prompt material for RP story tracking: a static protocol block
// explaining the tools, and a live state block carrying the canonical
// record so the model always sees it (tool results from prior turns are
// not resent to the model).

import type { ChatSession } from "../chatSession/chatSession"
import {
    getCurrentRPState,
    rpStateInjectionActive,
    rpTrackingActive,
} from "./state"
import { SUGGESTED_STAT_KEYS, type RPState } from "./types"

/**
 * Static protocol block appended to the system prompt while tracking is
 * active. Kept terse — it ships on every request.
 *
 * When the live state block is injected, the record is visible each turn;
 * otherwise the model must rely on rp_get_state for the canonical record.
 */
function buildProtocolBlock(stateInjected: boolean): string {
    // When no block is injected (injection off, or nothing committed yet),
    // the model has no visible record at all and must fetch it via the tool.
    const recordRef = stateInjected
        ? "The STORY STATE block in the system prompt is the last committed record, not a live mirror. If the user states something that conflicts with it, the user is right — update the record to match."
        : "There is no visible state block this turn; call rp_get_state when you need the current record. If the user states something that conflicts with the record, the user is right — update the record to match."
    return `[STORY STATE TRACKING]
You maintain a hidden, structured record of this story using the
rp_start_scenario, rp_get_state, and rp_update_state tools. The record is
only as current as your last call — nothing updates it for you.

- New story or major scene: call rp_start_scenario to record the setting,
  location, and every known character (description, stats, inventory).
- At the end of every turn call rp_update_state with any changed parts.
  If you skip it, the record stays stale and every future turn (and
  rp_get_state) reports outdated facts.
- Before spending or using an item, or resolving anything that depends on
  HP/inventory/stats, call rp_get_state if the last known value is not in
  the recent messages — and trust the returned record over memory.
- ${recordRef}
- Dialogue or introspection that changes none of the listed facts needs no
  update.
- These calls are invisible bookkeeping: never mention, narrate, or
  roleplay them. Keep the record terse: short facts, not prose. Use short
  lowercase stat keys (e.g. ${SUGGESTED_STAT_KEYS.join(", ")}); in a fiction
  with combat or injury, every character that can be hurt must track hp
  (and max_hp when it can change).`
}

/** Render the live state block (compact JSON to keep tokens low). */
export function renderStateBlock(state: RPState): string {
    return `[STORY STATE — canonical record; keep in sync with the narrative]
${JSON.stringify(state)}`
}

/**
 * The full RP tracking addition to the system prompt for a chat, or ""
 * when tracking (or, for the state block, injection) is not active.
 */
export function buildRPTrackingPrompt(chat: ChatSession | null | undefined): string {
    if (!chat || !rpTrackingActive(chat)) return ""
    const injectionActive = rpStateInjectionActive(chat)
    const state = injectionActive ? getCurrentRPState(chat) : null
    const parts = [buildProtocolBlock(injectionActive && !!state)]
    if (state) parts.push(renderStateBlock(state))
    return parts.join("\n\n")
}
