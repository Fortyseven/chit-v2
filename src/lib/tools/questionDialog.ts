import { get, writable } from 'svelte/store'
import { sndIsTypingPlaying, sndPlayQuestion, sndPlayTyping, sndStopTyping } from '../audio'
import { ttsSpeaking, ttsStop } from '../voice/tts'

export interface QuestionOption {
    label: string
    value: string
}

export interface QuestionDialogState {
    open: boolean
    question: string
    options: QuestionOption[]
    hasFreefrom: boolean
}

export const questionDialog = writable<QuestionDialogState>({
    open: false,
    question: '',
    options: [],
    hasFreefrom: false,
})

let pendingResolve: ((value: string) => void) | null = null
let wasSpeaking = false
let wasTypingPlaying = false

export async function askQuestion(
    question: string,
    options?: QuestionOption[]
): Promise<string> {
    return new Promise((resolve) => {
        pendingResolve = resolve

        // Pause TTS if currently speaking
        wasSpeaking = get(ttsSpeaking)
        if (wasSpeaking) {
            ttsStop()
        }

        // Pause typing audio if currently playing
        wasTypingPlaying = sndIsTypingPlaying()
        if (wasTypingPlaying) {
            sndStopTyping()
        }

        // Play question sound
        sndPlayQuestion()

        questionDialog.set({
            open: true,
            question,
            options: options || [],
            hasFreefrom: !options || options.length === 0,
        })
    })
}

export function submitAnswer(answer: string) {
    questionDialog.set({
        open: false,
        question: '',
        options: [],
        hasFreefrom: false,
    })
    if (pendingResolve) {
        pendingResolve(answer)
        pendingResolve = null
    }
    // Resume typing audio if it was playing before
    if (wasTypingPlaying) {
        sndPlayTyping()
    }
    // Note: We don't resume TTS here as user submitted an answer
    wasSpeaking = false
    wasTypingPlaying = false
}

export function closeQuestionDialog() {
    questionDialog.set({
        open: false,
        question: '',
        options: [],
        hasFreefrom: false,
    })
    if (pendingResolve) {
        pendingResolve('')
        pendingResolve = null
    }
    // Resume typing audio if it was playing before
    if (wasTypingPlaying) {
        sndPlayTyping()
    }
    // Note: We don't resume TTS here as dialog was cancelled
    wasSpeaking = false
    wasTypingPlaying = false
}
