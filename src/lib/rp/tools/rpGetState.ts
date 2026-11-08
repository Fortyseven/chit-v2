// rp_get_state: read the currently tracked story state.

import type { ToolDefinition } from "../../tools/types"
import { getLiveRPState, requireTrackingChat } from "../toolSupport"

export const rpGetStateTool: ToolDefinition = {
    name: "rp_get_state",
    description:
        "Read the currently tracked story state: title, location, characters (with description, stats, inventory, status), and plot notes. Call this before you need exact facts that may have changed out of view — before spending or using an item, before resolving anything that depends on HP or stats. Trust the returned record over memory. Optionally limit the result to specific character names.",
    parameters: {
        characters: {
            type: "array",
            items: { type: "string" },
            description:
                "Optional: limit the result to these character names (case-insensitive)",
        },
    },
    required: [],
    async handler(params, context) {
        const chat = requireTrackingChat(context)
        const state = getLiveRPState(chat)
        if (!state) {
            throw new Error(
                "No scenario is being tracked yet — call rp_start_scenario when the story begins"
            )
        }

        let characters = state.characters
        const filter = Array.isArray(params.characters)
            ? params.characters.map((c: any) => String(c).trim().toLowerCase())
            : []
        if (filter.length > 0) {
            characters = characters.filter((c) =>
                filter.includes(c.name.trim().toLowerCase())
            )
        }

        return {
            title: state.title,
            location: state.location,
            characters,
            notes: state.notes,
        }
    },
}
