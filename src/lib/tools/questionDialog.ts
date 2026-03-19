import { writable } from 'svelte/store'

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

export async function askQuestion(
    question: string,
    options?: QuestionOption[]
): Promise<string> {
    return new Promise((resolve) => {
        pendingResolve = resolve
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
}
