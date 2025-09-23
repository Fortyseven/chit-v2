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
