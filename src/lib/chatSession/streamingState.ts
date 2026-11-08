import { get, writable } from "svelte/store"
import type { RPState } from "$lib/rp/types"
import type { MediaAttachment } from "./chatAttachments"

export interface StreamingState {
    response_buffer: string
    thinking_buffer: string
    tool_call_info_buffer: string
    media_buffer: MediaAttachment[]
    /** RP story state committed by tool calls this turn (attached to the
     * promoted assistant message); null if no state changed this turn. */
    rp_state: RPState | null
    isThinking: boolean
    hasThoughts: boolean
    lastTokenCount: number
}

const defaultState: StreamingState = {
    response_buffer: "",
    thinking_buffer: "",
    tool_call_info_buffer: "",
    media_buffer: [],
    rp_state: null,
    isThinking: false,
    hasThoughts: false,
    lastTokenCount: 0,
}

export const streamingState = writable<StreamingState>({ ...defaultState })

export function resetStreamingState() {
    streamingState.set({ ...defaultState })
}

export function appendStreamingResponse(fragment: string, tokenEstimate: number) {
    streamingState.update((s) => ({
        ...s,
        response_buffer: s.response_buffer + fragment,
        isThinking: false,
        lastTokenCount: s.lastTokenCount + tokenEstimate,
    }))
}

export function appendStreamingThoughts(fragment: string, tokenEstimate: number) {
    streamingState.update((s) => ({
        ...s,
        thinking_buffer: s.thinking_buffer + fragment,
        isThinking: true,
        hasThoughts: true,
        lastTokenCount: s.lastTokenCount + tokenEstimate,
    }))
}

export function setStreamingToolCallInfo(info: string) {
    streamingState.update((s) => ({
        ...s,
        tool_call_info_buffer: info,
    }))
}

/**
 * Stash the RP story state produced by tool calls this turn. The promoted
 * assistant message picks it up as its rp_state snapshot.
 */
export function setStreamingRPState(state: RPState) {
    streamingState.update((s) => ({
        ...s,
        rp_state: state,
    }))
}

/** The RP state stashed this turn, or null if no state change yet. */
export function getStreamingRPState(): RPState | null {
    return get(streamingState).rp_state
}

export function addStreamingMedia(attachment: MediaAttachment) {
    streamingState.update((s) => ({
        ...s,
        media_buffer: [...s.media_buffer, attachment],
    }))
}