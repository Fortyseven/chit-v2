import { get, writable } from "svelte/store"
import { ChatKnobsState } from "./ChatKnobsState.svelte.js"
import { ChatMessageEntry } from "./ChatMessageEntry.svelte.js"

export class ChatState {
    knobs = new ChatKnobsState()

    system_prompt = writable("")
    variables = writable({})
    timeline = $state([])
    model = $state("llama3.2:latest")

    fuck = $state(undefined)

    pushUserMessage = (message) => {
        this.timeline.push(ChatMessageEntry("user", message))
        // console.log(`*** USER pushed ${message}`, this.timeline)
    }

    pushAssistantMessage = (message) => {
        this.timeline.push(ChatMessageEntry("assistant", message))
        // console.log(`*** ASS pushed ${message}`, this.timeline)
    }

    pushSystemMessage = (message) => {
        this.timeline.push(ChatMessageEntry("system", message))
    }

    pushMediaMessage = (message) => {
        // TODO: implement media message
    }

    constructor(chat_id) {
        // this.pushAssistantMessage("Cool cool " + suffix)
        // this.pushUserMessage("Hello! " + suffix)
        // this.pushAssistantMessage("What is up, my dude? " + suffix)
        // this.pushUserMessage(
        //     "Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling,  " +
        //         suffix
        // )
        // this.pushAssistantMessage("Cool cool " + suffix)
    }
}
