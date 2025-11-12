import { get, writable } from "svelte/store"
import { appState } from "../appState/appState"
import { SpeakOptions, TTSEngine } from "./TTSEngine"
import { createWebSpeechEngine } from "./WebSpeechEngine"

// Settings specific to TTS
export interface VoiceSettings {
    ttsEngineId: string
    autoSpeak: boolean
    preferredVoice: string | null
    rate: number
    pitch: number
    volume: number
    enabled: boolean
}

// Local storage persistence key
const VOICE_SETTINGS_KEY = "chitVoiceSettings"

const defaults: VoiceSettings = {
    ttsEngineId: "webspeech",
    autoSpeak: false,
    preferredVoice: null,
    rate: 1,
    pitch: 1,
    volume: 1,
    enabled: true,
}

export const voiceSettings = writable<VoiceSettings>({ ...defaults })

// Restore from localStorage
if (typeof window !== "undefined") {
    try {
        const raw = localStorage.getItem(VOICE_SETTINGS_KEY)
        if (raw) {
            const parsed = JSON.parse(raw)
            voiceSettings.set({ ...defaults, ...parsed })
        }
    } catch (e) {
        console.warn("Failed to load voice settings", e)
    }
    voiceSettings.subscribe((v) => {
        localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(v))
    })
}

// Engine registry
const engines: Record<string, TTSEngine> = {
    webspeech: createWebSpeechEngine(),
}

export const ttsSpeaking = writable(false)
export const ttsCurrentText = writable<string>("")

function getEngine(): TTSEngine {
    const id = get(voiceSettings).ttsEngineId
    return engines[id] || engines["webspeech"]
}

export async function ttsSpeak(text: string, partial: boolean = false) {
    if (!text) return
    const settings = get(voiceSettings)
    if (!settings.enabled) return
    const engine = getEngine()
    ttsCurrentText.set(text)
    await engine.speak({
        text,
        voice: settings.preferredVoice || undefined,
        rate: settings.rate,
        pitch: settings.pitch,
        volume: settings.volume,
        onStart: () => ttsSpeaking.set(true),
        onEnd: () => ttsSpeaking.set(false),
        onError: () => ttsSpeaking.set(false),
    } as SpeakOptions)
}

export function ttsStop() {
    const engine = getEngine()
    engine.stop()
    ttsSpeaking.set(false)
}

export async function ttsListVoices() {
    return getEngine().listVoices()
}

// Convenience to auto-speak last assistant message
import { currentChat } from "../chatSession/chatSession"
export function ttsSpeakLatestAssistant() {
    const messages = get(currentChat)?.messages || []
    const last = [...messages].reverse().find((m) => m.role === "assistant")
    if (!last) return
    ttsSpeak(last.content as string)
}

// Hook: allow external trigger when chat finishes streaming
export function ttsMaybeAutoSpeak() {
    const settings = get(voiceSettings)
    if (!settings.autoSpeak || !settings.enabled) return
    ttsSpeakLatestAssistant()
}

// Public API for future dynamic engine registration
export function registerTTSEngine(id: string, engine: TTSEngine) {
    engines[id] = engine
}
