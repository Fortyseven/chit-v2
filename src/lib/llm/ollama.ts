import { ChatRequest, Message, ModelResponse, Ollama } from "ollama/browser"
import { get, Writable, writable } from "svelte/store"
import { appState, DEFAULT_OL_ENDPOINT } from "../../appState/appState"
import {
    chatAppendStreamingPending,
    chatFind,
    chatInProgress,
    chatSetWasAborted,
    DEFAULT_CONTEXT,
    DEFAULT_TEMPERATURE,
} from "../chatSession/chatActions"

export class LLMInterface {
    models: Writable<ModelResponse[]> = writable([])
    ol_instance: Writable<Ollama | undefined> = writable(undefined)
    ol_instance_host: Writable<String> = writable("")
    first_load = true

    /***************************************************
     * Connects to the Ollama server using the current host endpoint
     */
    async instantiateOL() {
        // convos.q
        try {
            // only reinstantiate if the host has changed
            if (
                this.first_load ||
                get(this.ol_instance_host) !== DEFAULT_OL_ENDPOINT
            ) {
                this.ol_instance.set(
                    new Ollama({
                        host: get(appState).apiEndpoint as string,
                    })
                )
                this.ol_instance_host.set(get(appState).apiEndpoint)

                console.log(
                    "🤖🌎 Updated Ollama instance host to ",
                    get(this.ol_instance_host)
                )

                await this.refreshModelList()
                this.first_load = false
            } else {
                console.log(
                    "🤖🚭 Ollama instance already instantiated at",
                    get(this.ol_instance_host)
                )
            }
        } catch (e) {
            console.error("Error instantiating Ollama:", e)
        }
    }

    /***************************************************
     * Refreshes the list of models from the Ollama server
     */
    async refreshModelList() {
        try {
            let inst = get(this.ol_instance) as Ollama

            if (!inst) {
                console.error("Ollama instance not found")
                return
            }

            let models = await inst.list()
            this.models.set(models.models)

            // sort
            this.models.update((models) =>
                models.sort((a, b) => a.name.localeCompare(b.name))
            )
        } catch (e) {
            console.error("Error refreshing model list:", e)
        }
    }

    /***************************************************
     *
     * @param {ChatSession} chat_session
     */
    async chatUpdateSession(chatId: String) {
        let chat_session = chatFind(chatId)

        if (!chat_session) {
            console.error("Chat session not found: " + chatId)
            return
        }

        let messages: Message[] = []

        if (chat_session.system_prompt) {
            messages.push({
                role: "system",
                content: chat_session.system_prompt as string,
            })
        }

        for (let message of chat_session.messages) {
            let msg = message.content.trim()

            messages.push({
                role: message.role,
                content: msg as string,
            })
        }

        console.log("🤖📡 Submitting chat session:", messages)

        if (!this.ol_instance) {
            console.error("Ollama instance not found")
            return
        }

        let inst = get(this.ol_instance) as Ollama

        if (inst) {
            const config: ChatRequest = {
                model: chat_session.model_name as string,
                messages,
                stream: true,
                options: {
                    temperature:
                        chat_session.settings?.temperature ||
                        DEFAULT_TEMPERATURE,
                    num_ctx: chat_session.settings?.num_ctx || DEFAULT_CONTEXT,
                },
            }

            chatInProgress.set(true)
            chatSetWasAborted(chatId, false)

            try {
                let stream = await inst.chat(config as ChatRequest)

                sndPlayTyping()
                for await (const part of stream) {
                    // sndPlayTick()
                    chatAppendStreamingPending(chatId, part.message.content)
                }
            } catch (e) {
                console.error("Error updating chat session:", e)
            } finally {
                chatInProgress.set(false)
                sndStopTyping()
                sndPlayResponse()
            }
        }
    }
}

const llm_instance = new LLMInterface()
await llm_instance.instantiateOL()

let llm: Writable<LLMInterface> = writable(llm_instance)

export default llm
