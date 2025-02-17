// @ts-nocheck
import { Ollama } from "ollama"
import { get, writable } from "svelte/store"
import { appState } from "../../stores/appState.svelte"

class LLMInterface {
    models = $state([])
    ol_instance = $state(undefined)
    ol_instance_host = $state(undefined)
    first_load = true

    // Connects to the Ollama server using the current host endpoint
    /**
     *
     */
    async instantiateOL() {
        // convos.q
        try {
            // only reinstantiate if the host has changed
            if (
                this.first_load ||
                this.ol_instance_host !== get(appState)?.apiEndpoint
            ) {
                this.ol_instance = new Ollama({
                    host: appState.apiEndpoint,
                })
                this.ol_instance_host = get(appState)?.apiEndpoint

                console.log(
                    "🤖🌎 Updated Ollama instance host to ",
                    this.ol_instance_host
                )

                await this.refreshModelList()
                this.first_load = false
            } else {
                console.log(
                    "🤖🚭 Ollama instance already instantiated at",
                    this.ol_instance_host
                )
            }
        } catch (e) {
            console.error("Error instantiating Ollama:", e)
        }
    }

    async refreshModelList() {
        try {
            this.models = await this.ol_instance.list()
            this.models = this.models.models
        } catch (e) {
            console.error("Error refreshing model list:", e)
        }
    }

    /**
     *
     * @param {ChatSession} chat_session
     */
    async updateSession(chat_session) {
        console.log(chat_session.conversation)
        let messages = [...chat_session.conversation.timeline]

        if (chat_session.conversation.system_prompt) {
            messages = [
                {
                    role: "system",
                    content: chat_session.conversation.system_prompt,
                },
                ...messages,
            ]
        }

        console.log("🤖📡 Submitting chat session:", messages)

        // debugger
        var response = await this.ol_instance.chat({
            model: chat_session.conversation.model,
            messages,
        })
        console.log("🤖📡 Ollama response:", response)
        chat_session.conversation.pushAssistantMessage(response.message.content)
    }
}

var llm = new LLMInterface()
await llm.instantiateOL()

export default llm
