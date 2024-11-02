// @ts-nocheck
import { configValues } from "$stores/appState.svelte"
import { Ollama } from "ollama"
import { writable } from "svelte/store"

export const DEFAULT_OL_ENDPOINT = "http://localhost:11434"

class LLMInterface {
    models = $state([])
    ol_instance = $state(undefined)
    ol_instance_host = $state(undefined)

    // Connects to the Ollama server using the current host endpoint
    async instantiateOL() {
        try {
            // only reinstantiate if the host has changed
            if (this.ol_instance_host !== configValues?.apiEndpoint) {
                console.log(
                    "🤖 Updating Ollama instance host to ",
                    configValues.apiEndpoint
                )
                this.ol_instance = new Ollama({
                    host: configValues.apiEndpoint,
                })
                this.ol_instance_host = configValues.apiEndpoint
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
await llm.instantiateOL()

export default llm

console.log("🤖 LLM Interface loaded", llm.models)
