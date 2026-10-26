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

const audioThinking = new Audio("assets/audio/thinking.mp3")
audioThinking.loop = true
audioThinking.preload = "auto"
audioThinking.volume = 0.5

const audioQuestion = new Audio("assets/audio/question.wav")
audioQuestion.preload = "auto"

// const audioFail = new Audio("assets/audio/fail.wav")
// audioResponse.preload = "auto"

export function sndPlayResponse() {
    if (get(appState).soundEnabled) {
        audioResponse.play()
    }
}

export function sndPlayQuestion() {
    if (get(appState).soundEnabled) {
        audioQuestion.play()
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
    audioTyping.pause()
    audioTyping.currentTime = 0
    audioThinking.pause()
    audioThinking.currentTime = 0
}

export function sndIsTypingPlaying() {
    return !audioTyping.paused
}

export function sndPlayThinking() {
    if (!get(appState).soundEnabled) return
    if (!audioThinking.paused) return
    // Stop processing audio if it's playing, then start thinking audio
    if (!audioTyping.paused) {
        audioTyping.pause()
        audioTyping.currentTime = 0
    }
    audioThinking.play()
}

export function sndStopThinking() {
    audioThinking.pause()
    audioThinking.currentTime = 0
}

export function sndIsThinkingPlaying() {
    return !audioThinking.paused
}
// New tone function
let sharedAudioCtx: AudioContext | undefined
// Track currently playing tone so a new call interrupts it
let activeTone: OscillatorNode | null = null
