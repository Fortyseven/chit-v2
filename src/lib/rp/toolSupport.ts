// Shared helpers for the rp_* tools: chat lookup with a tracking guard,
// and resolving "the state the model should consider current right now"
// (this turn's stashed update, else the last committed snapshot).

import { chatFind } from "../chatSession/chatActions"
import { getStreamingRPState } from "../chatSession/streamingState"
import type { ChatSession } from "../chatSession/chatSession"
import type { ToolContext } from "../tools/types"
import { getCurrentRPState, rpTrackingActive } from "./state"
import type { RPState } from "./types"

/**
 * Resolve the chat for a tool call and require that tracking is active,
 * throwing a descriptive error the model can act on otherwise.
 */
export function requireTrackingChat(context?: ToolContext): ChatSession {
    const chat = chatFind(context?.chatId ?? "")
    if (!chat) throw new Error("Chat session not found")
    if (!rpTrackingActive(chat)) {
        throw new Error(
            "RP story tracking is not active in this chat. It requires RP mode with tools enabled."
        )
    }
    return chat
}

/**
 * Current effective state during a turn: the update stashed earlier in
 * this same turn (so batched tool calls chain), else the last state
 * committed on message history. Null if nothing has been recorded yet.
 */
export function getLiveRPState(chat: ChatSession): RPState | null {
    return getStreamingRPState() ?? getCurrentRPState(chat)
}
