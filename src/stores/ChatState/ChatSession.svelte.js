import { persisted } from "svelte-persisted-store"
import { get } from "svelte/store"
import { z } from "zod"
import zodToJsonSchema from "zod-to-json-schema"
import llm from "../../lib/llm/ollama.svelte"
import { ChatState } from "./ChatState.svelte"

const SummaryTitle = z.object({
    title: z.string(),
})

export class ChatSession {
    chat_id = Math.floor(Math.random() * 100000)
    title = "Untitled Chat " + this.chat_id

    _regen_title = true

    /**
     * @type {ChatState}
     */
    chatState = new ChatState(this.chat_id)

    async submitUserMessage(user_message) {
        try {
            this.chatState.pushUserMessage(user_message)
            const llm_resp = await llm.updateSession(this)

            if (this._regen_title) {
                // TODO: fix this
                // const resp = await llm.ol_instance.chat({
                //     model: this.chatState.model,
                //     messages: [
                //         {
                //             role: "system",
                //             content:
                //                 "You will be provided with the content of a user conversation. Provide a short one-sentence summary of this chat so far, for use as a title.",
                //         },
                //         // TODO: Add system prompt here?
                //         {
                //             role: "user",
                //             content: user_message,
                //         },
                //     ],
                //     format: zodToJsonSchema(SummaryTitle),
                // })
                // // this.title = SummaryTitle.parse(
                // //     JSON.parse(resp.message.content)
                // // ).title
                // this._regen_title = false
            }

            return llm_resp
        } catch (e) {
            console.error("💀 Error submitting chat session:", e)
        }
    }

    constructor() {
        console.log(`📝 Created new chat session ${this.title}`)
    }
}
