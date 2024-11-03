import { ChatSession } from "./ChatState/ChatSession.svelte"

class Convos {
    entries = $state([new ChatSession(), new ChatSession()])

    /**
     * @param {number} index
     */
    rm(index) {
        this.entries.splice(index, 1)
    }

    constructor() {
        console.log("created convos")
    }
}

export const convos = $state(new Convos())
