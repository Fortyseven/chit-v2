import { get } from "svelte/store"
import { appState } from "./appState/appState"

// const audioResponse = new Audio("assets/response.wav")
const audioResponse = new Audio("assets/audio/complete.mp3")
audioResponse.preload = "auto"

// const audioTick = new Audio("assets/audio/tick.wav")
// audioTick.preload = "auto"

const audioTyping = new Audio("assets/audio/processing.mp3")
audioTyping.loop = true
audioTyping.preload = "auto"
audioTyping.volume = 0.5

// const audioFail = new Audio("assets/audio/fail.wav")
// audioResponse.preload = "auto"

export function sndPlayResponse() {
    if (get(appState).soundEnabled) {
        audioResponse.play()
    }
}

// export function sndPlayTick() {
//     if (get(appState).soundEnabled) {
//         audioTick.play()
//     }
// }

// export function sndPlayFail() {
//     if (get(appState).soundEnabled) {
//         audioFail.play()
//     }
// }

export function sndPlayTyping() {
    if (get(appState).soundEnabled) {
        audioTyping.play()
    }
}

export function sndStopTyping() {
    if (get(appState).soundEnabled) {
        audioTyping.pause()
        audioTyping.currentTime = 0
    }
}
// New tone function
let sharedAudioCtx: AudioContext | undefined
// Track currently playing tone so a new call interrupts it
let activeTone: OscillatorNode | null = null

/**
 * Play a short synthesized tone, interrupting any previous tone
 * @param frequency Hertz (> 0)
 * @param durationMs Duration in ms (> 0)
 * @param volume Linear gain 0..1 (default 0.5)
 * @returns Promise resolving after the tone ends (earlier if interrupted by a new call)
 */
export function sndPlayTone(
    frequency: number,
    durationMs: number,
    volume: number = 0.5
): Promise<void> {
    if (!get(appState).soundEnabled) return Promise.resolve()
    if (typeof window === "undefined" || typeof AudioContext === "undefined")
        return Promise.resolve()
    if (!(frequency > 0) || !(durationMs > 0)) return Promise.resolve()
    try {
        // Interrupt any currently playing tone
        if (activeTone) {
            try {
                activeTone.stop()
            } catch (e) {
                // ignore if already stopped
            }
            activeTone = null
        }
        sharedAudioCtx ??= new AudioContext()
        const ctx = sharedAudioCtx
        if (ctx.state === "suspended") {
            ctx.resume().catch((err) =>
                console.error("sndPlayTone resume failed", err)
            )
        }
        const osc: OscillatorNode = ctx.createOscillator()
        const gain: GainNode = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = frequency
        gain.gain.value = Math.min(Math.max(volume, 0), 1)
        osc.connect(gain)
        gain.connect(ctx.destination)
        activeTone = osc
        const now: number = ctx.currentTime
        osc.start(now)
        osc.stop(now + durationMs / 1000)
        return new Promise<void>((resolve) => {
            osc.addEventListener("ended", () => {
                if (activeTone === osc) activeTone = null
                resolve()
            })
        })
    } catch (err) {
        console.error("Failed to play tone", err)
        return Promise.resolve()
    }
}
