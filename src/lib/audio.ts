// import { appState } from "$stores/stores"
import { get } from "svelte/store"

const audioResponse = new Audio("assets/response.wav")
audioResponse.preload = "auto"

const audioTick = new Audio("assets/tick.wav")
audioTick.preload = "auto"

const audioTyping = new Audio("assets/typing.wav")
audioTyping.loop = true
audioTick.preload = "auto"

const audioFail = new Audio("assets/fail.wav")
audioResponse.preload = "auto"

export function sndPlayResponse() {
    // if (get(appState).ui.play_sounds) {
    audioResponse.play()
    // }
}

export function sndPlayTick() {
    // if (get(appState).ui.play_sounds) {
    audioTick.play()
    // }
}

export function sndPlayFail() {
    // if (get(appState).ui.play_sounds) {
    audioFail.play()
    // }
}

export function sndPlayTyping() {
    // admittedly, this is very silly

    // if (get(appState).ui.play_sounds) {

    audioTyping.play()
    // }
}

export function sndStopTyping() {
    audioTyping.pause()
    audioTyping.currentTime = 0
}
