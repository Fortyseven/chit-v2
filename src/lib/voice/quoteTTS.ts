import { get } from "svelte/store"
import { isRPMode } from "../modes/modeUtils"
import { ttsSpeakQueued, voiceSettings } from "./tts"

const queue: string[] = []
let processing = false

async function processQueue(): Promise<void> {
    if (processing || queue.length === 0) return
    processing = true
    while (queue.length > 0) {
        const text = queue.shift()!
        await ttsSpeakQueued(text)
    }
    processing = false
}

/**
 * Queue a quote string for sequential TTS playback.
 * Only active when TTS is enabled, autoSpeakQuotes is on, and the app is in RP mode.
 */
export function queueQuote(text: string): void {
    const settings = get(voiceSettings)
    if (!settings.enabled || !settings.autoSpeakQuotes) return
    if (!isRPMode()) return
    if (!text || !text.trim()) return
    queue.push(text)
    processQueue()
}

/**
 * Clear pending quotes and stop accepting new ones.
 * The currently speaking quote (if any) will finish naturally.
 */
export function clearQuoteQueue(): void {
    queue.length = 0
    processing = false
}
