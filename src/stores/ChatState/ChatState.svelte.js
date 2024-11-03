import { ChatKnobsState } from "./ChatKnobsState.svelte.js"
import { ChatMessageEntry } from "./ChatMessageEntry.svelte.js"

export class ChatState {
    knobs = new ChatKnobsState()
    system_prompt = $state("")
    variables = $state({})
    timeline = $state([])

    pushUserMessage = (message) => {
        this.timeline.push(new ChatMessageEntry("user", message))
    }

    pushAssistantMessage = (message) => {
        this.timeline.push(new ChatMessageEntry("assistant", message))
        console.log(`pushed ${message}`, this.timeline)
    }

    pushSystemMessage = (message) => {
        this.timeline.push(new ChatMessageEntry("system", message))
    }

    pushMediaMessage = (message) => {
        // TODO: implement media message
    }

    constructor(suffix) {
        this.pushUserMessage("Hello! " + suffix)
        this.pushAssistantMessage("What is up, my dude? " + suffix)
        this.pushUserMessage(
            "Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling,  " +
                suffix
        )
        this.pushAssistantMessage("Cool cool " + suffix)
        this.pushUserMessage("Hello! " + suffix)
        this.pushAssistantMessage("What is up, my dude? " + suffix)
        this.pushUserMessage(
            "Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling,  " +
                suffix
        )
        this.pushAssistantMessage("Cool cool " + suffix)
        this.pushUserMessage("Hello! " + suffix)
        this.pushAssistantMessage("What is up, my dude? " + suffix)
        this.pushUserMessage(
            "Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling, Not much, just chilling,  " +
                suffix
        )
        this.pushAssistantMessage("Cool cool " + suffix)
    }
}
