import { ChatState } from "./ChatState.svelte"

export class ChatSession {
    chat_id = $state(Math.floor(Math.random() * 100000))
    title = $state("Untitled Chat " + this.chat_id)
    chatState = new ChatState(this.chat_id)

    constructor() {
        console.log(`created chat session ${this.title}`)
    }
}
