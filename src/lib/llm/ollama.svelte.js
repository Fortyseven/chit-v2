// @ts-nocheck
import { Ollama } from "ollama"
import { writable } from "svelte/store"
import { convos } from "../../stores/chatState.svelte"

import { configPersistState } from "../../stores/configPersistState.svelte"

class LLMInterface {
    models = $state([])
    ol_instance = $state(undefined)
    ol_instance_host = $state(undefined)

    // Connects to the Ollama server using the current host endpoint
    /**
     *
     * @param {Convos} convos
     */
    async instantiateOL(convos) {
        // convos.q
        try {
            // only reinstantiate if the host has changed
            if (this.ol_instance_host !== configPersistState?.apiEndpoint) {
                console.log(
                    "🤖 Updating Ollama instance host to ",
                    configPersistState.apiEndpoint
                )
                this.ol_instance = new Ollama({
                    host: configPersistState.apiEndpoint,
                })
                this.ol_instance_host = configPersistState.apiEndpoint
                await this.refreshModelList()
            }
        } catch (e) {
            console.error("Error instantiating Ollama:", e)
        }
    }

    async refreshModelList() {
        try {
            this.models = await this.ol_instance.list()
            $inspect("🤖 Refreshed model list", this.models)
        } catch (e) {
            console.error("Error refreshing model list:", e)
        }
    }
}

var llm = new LLMInterface()
await llm.instantiateOL(convos)

export default llm

console.log("🤖 LLM Interface loaded", llm.models)
