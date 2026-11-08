// rp_update_state: merge partial changes into the tracked story state.

import { setStreamingRPState } from "../../chatSession/streamingState"
import type { ToolDefinition } from "../../tools/types"
import { applyPartialUpdate, type RPPartialUpdate } from "../state"
import { getLiveRPState, requireTrackingChat } from "../toolSupport"

export const rpUpdateStateTool: ToolDefinition = {
    name: "rp_update_state",
    description:
        "Call this whenever the story state changes with only the parts that changed: location, characters (upserted by name — new names create characters), HP/condition, inventory, and plot notes. Call this at the end of any turn where one of those changed — combat damage, physical injury, items gained or lost, movement, a character arriving or leaving. If you don't, the record stays stale for all future turns. Returns the full updated state.",
    parameters: {
        title: {
            type: "string",
            description: "New title for the scenario (optional)",
        },
        location: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "New current location name",
                },
                description: {
                    type: "string",
                    description: "Brief description of the new location",
                },
            },
            description:
                "The characters' current location (merge — include only what changed)",
        },
        characters: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description:
                            "Character name (matches existing characters case-insensitively; unknown names add a new character)",
                    },
                    description: {
                        type: "string",
                        description: "Updated description (optional)",
                    },
                    status: {
                        type: "string",
                        description:
                            "Updated current state: condition, mood, intentions (optional)",
                    },
                    inventory: {
                        type: "array",
                        items: { type: "string" },
                        description:
                            "Full replacement of the character's inventory (omit to leave unchanged)",
                    },
                    stats: {
                        type: "object",
                        description:
                            "Stat fields to set or change, merged over existing values, e.g. {\"hp\": 30}",
                    },
                },
                required: ["name"],
            },
            description:
                "Characters to add or update; only include the fields that changed",
        },
        remove_characters: {
            type: "array",
            items: { type: "string" },
            description: "Names of characters to remove from the record",
        },
        notes: {
            type: "string",
            description:
                "Full replacement of the plot notes field (omit to leave unchanged)",
        },
        append_notes: {
            type: "string",
            description: "Text to append to the plot notes (optional)",
        },
    },
    required: [],
    async handler(params, context) {
        const chat = requireTrackingChat(context)
        const base = getLiveRPState(chat)
        if (!base) {
            throw new Error(
                "No scenario is being tracked yet — call rp_start_scenario to initialize the record first"
            )
        }

        const hasContent =
            (typeof params.title === "string" && params.title.trim() !== "") ||
            (params.location &&
                typeof params.location === "object" &&
                Object.keys(params.location).length > 0) ||
            (Array.isArray(params.characters) && params.characters.length > 0) ||
            (Array.isArray(params.remove_characters) &&
                params.remove_characters.length > 0) ||
            params.notes !== undefined ||
            (typeof params.append_notes === "string" &&
                params.append_notes.trim() !== "")
        if (!hasContent) {
            throw new Error(
                "rp_update_state was called with no changes — provide location, characters, remove_characters, notes, or append_notes"
            )
        }

        const update: RPPartialUpdate = {
            title:
                typeof params.title === "string" ? params.title : undefined,
            location:
                params.location && typeof params.location === "object"
                    ? params.location
                    : undefined,
            characters: Array.isArray(params.characters)
                ? params.characters
                : undefined,
            remove_characters: Array.isArray(params.remove_characters)
                ? params.remove_characters.map((n: any) => String(n))
                : undefined,
            notes:
                typeof params.notes === "string" ? params.notes : undefined,
            append_notes:
                typeof params.append_notes === "string"
                    ? params.append_notes
                    : undefined,
        }

        const next = applyPartialUpdate(base, update)
        setStreamingRPState(next)
        // Return the full state so the model sees the canonical record
        return next
    },
}
