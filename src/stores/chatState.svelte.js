import { derived, get, writable } from "svelte/store"
import app from "../main"
import { currentConvoIndex } from "./appState.svelte"
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

export const convos = writable(new Convos())

// const currentConvoDerived = $derived(convos.entries[get(currentConvoIndex)])

// export function currentConvo() {
//     return currentConvoDerived
// }

export const currentConvo = derived(
    [convos, currentConvoIndex],
    ([$convos, $currentConvoIndex]) => {
        return $convos.entries[$currentConvoIndex]
    }
)
