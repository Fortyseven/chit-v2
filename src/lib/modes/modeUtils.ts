import { get } from "svelte/store"
import { chatSetCurrentMode } from "../chatSession/chatActions"
import { AppMode, currentChatMode } from "../chatSession/chatSession"

/**
 * Utility functions for working with application modes (per-session)
 */

/**
 * Check if the current chat mode is Default
 */
export function isDefaultMode(): boolean {
    return get(currentChatMode) === AppMode.DEFAULT
}

/**
 * Check if the current chat mode is RP (Role Playing)
 */
export function isRPMode(): boolean {
    return get(currentChatMode) === AppMode.RP
}

/**
 * Get the current chat's mode
 */
export function getCurrentMode(): AppMode {
    return get(currentChatMode)
}

/**
 * Check if a specific mode is active for the current chat
 */
export function isModeActive(mode: AppMode): boolean {
    return get(currentChatMode) === mode
}

/**
 * Set the current chat's mode
 */
export function setCurrentMode(mode: AppMode): void {
    chatSetCurrentMode(mode)
}

// Re-export for convenience
export { chatSetCurrentMode } from "../chatSession/chatActions"
export { AppMode, currentChatMode } from "../chatSession/chatSession"
