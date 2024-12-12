// @ts-nocheck
import { Ollama } from "ollama"
import { get, writable } from "svelte/store"
import { convos } from "../../stores/chatState.svelte"

import { ChatSession } from "../../stores/ChatState/ChatSession.svelte"
import { configPersistState } from "../../stores/configPersistState.svelte"

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
                this.ol_instance_host !== get(configPersistState)?.apiEndpoint
            ) {
                this.ol_instance = new Ollama({
                    host: configPersistState.apiEndpoint,
                })
                this.ol_instance_host = get(configPersistState)?.apiEndpoint

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
        console.log(
            "🤖📡 Submitting chat session:",
            chat_session.chatState.timeline
        )
        // debugger
        var response = await this.ol_instance.chat({
            model: chat_session.chatState.model,
            messages: chat_session.chatState.timeline,
        })
        console.log("🤖📡 Ollama response:", response)
        chat_session.chatState.pushAssistantMessage(response.message.content)
    }
}

var llm = new LLMInterface()
await llm.instantiateOL()

export default llm
