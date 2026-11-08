// rp_start_scenario: initialize (or reset) the tracked story record.

import { setStreamingRPState } from "../../chatSession/streamingState"
import type { ToolDefinition } from "../../tools/types"
import { requireTrackingChat } from "../toolSupport"
import type { RPCharacter, RPState } from "../types"

const characterItemSchema = {
    type: "object",
    properties: {
        name: {
            type: "string",
            description: "Character name",
        },
        description: {
            type: "string",
            description: "Brief physical and character description",
        },
        status: {
            type: "string",
            description: "Current state: condition, mood, intentions",
        },
        inventory: {
            type: "array",
            items: { type: "string" },
            description: "Items the character currently carries",
        },
        stats: {
            type: "object",
            description:
                'Free-form stat fields that fit the fiction, e.g. {"hp": 40, "max_hp": 100, "level": 3}',
        },
    },
    required: ["name", "description"],
}

export const rpStartScenarioTool: ToolDefinition = {
    name: "rp_start_scenario",
    description:
        "Initialize the story tracking record for a new roleplay scenario: its title, the current location, and all known characters with their description, stats, and inventory. Call this when a new story or major scene begins. Replaces any existing record.",
    parameters: {
        title: {
            type: "string",
            description: "Short name for the scenario or story",
        },
        location: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Name of the current location",
                },
                description: {
                    type: "string",
                    description: "Brief description of the location",
                },
            },
            required: ["name"],
        },
        characters: {
            type: "array",
            items: characterItemSchema,
            description: "All characters present or relevant to the story",
        },
        notes: {
            type: "string",
            description: "Initial plot notes or unresolved threads (optional)",
        },
    },
    required: ["title", "location", "characters"],
    async handler(params, context) {
        // Guard: only runs when tracking is active (RP mode + tools)
        requireTrackingChat(context)

        const loc =
            params.location && typeof params.location === "object"
                ? params.location
                : {}
        const rawChars = Array.isArray(params.characters)
            ? params.characters
            : []

        const characters: RPCharacter[] = []
        for (const c of rawChars) {
            if (!c || typeof c.name !== "string" || !c.name.trim()) continue
            characters.push({
                name: c.name.trim(),
                description:
                    typeof c.description === "string" ? c.description : "",
                status: typeof c.status === "string" ? c.status : "",
                inventory: Array.isArray(c.inventory)
                    ? c.inventory.map((i: any) => String(i))
                    : [],
                stats: c.stats && typeof c.stats === "object" ? c.stats : {},
            })
        }

        const state: RPState = {
            title: typeof params.title === "string" ? params.title : "",
            location: {
                name: typeof loc.name === "string" ? loc.name : "",
                description:
                    typeof loc.description === "string"
                        ? loc.description
                        : "",
            },
            characters,
            notes: typeof params.notes === "string" ? params.notes : "",
        }

        setStreamingRPState(state)
        // Return the full state so the model sees the canonical record
        return state
    },
}
