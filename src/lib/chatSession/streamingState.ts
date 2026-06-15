import { writable } from "svelte/store"
import type { MediaAttachment } from "./chatAttachments"

export interface StreamingState {
    response_buffer: string
    thinking_buffer: string
    tool_call_info_buffer: string
    media_buffer: MediaAttachment[]
    isThinking: boolean
    hasThoughts: boolean
    lastTokenCount: number
}

const defaultState: StreamingState = {
    response_buffer: "",
    thinking_buffer: "",
    tool_call_info_buffer: "",
    media_buffer: [],
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

export function addStreamingMedia(attachment: MediaAttachment) {
    streamingState.update((s) => ({
        ...s,
        media_buffer: [...s.media_buffer, attachment],
    }))
}