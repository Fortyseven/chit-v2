import { ChatRequest, Message, Ollama } from "ollama"
import { get, Writable, writable } from "svelte/store"
import { chatAddRoleMessage, chatFind } from "../../chatSession/chatActions"
import { appState } from "../../stores/appState"

class LLMInterface {
    models = writable([])
    ol_instance: Writable<Ollama | undefined> = writable(undefined)
    ol_instance_host = writable(undefined)
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
                get(this.ol_instance_host) !== get(appState)?.apiEndpoint
            ) {
                this.ol_instance.set(
                    new Ollama({
                        host: appState.apiEndpoint,
                    })
                )
                this.ol_instance_host.set(get(appState)?.apiEndpoint)

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

    /**
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

    /**
     *
     * @param {ChatSession} chat_session
     */
    async chatUpdateSession(chatId: String) {
        // let chat_session: ChatSession | undefined = get<ChatSession[]>(
        //     chats
        // ).find((chat: ChatSession) => chat.id === chatId)

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
            if (msg) {
                messages.push({
                    role: message.role,
                    content: msg as string,
                })
            }
        }

        console.log("🤖📡 Submitting chat session:", messages)

        if (!this.ol_instance) {
            console.error("Ollama instance not found")
            return
        }

        // debugger
        let inst = get(this.ol_instance) as Ollama

        if (inst) {
            const config: ChatRequest = {
                model: chat_session.model_name as string,
                messages,
                stream: false,
            }

            console.log("-------------------------------------- START")
            // dump messages to console
            for (let message of messages) {
                console.log(
                    "🤖📡 Ollama message:",
                    message.role,
                    message.content
                )
            }
            console.log("-------------------------------------- END")

            let response = await inst.chat(config as ChatRequest)

            console.log("🤖📡 Ollama response:", response)

            chatAddRoleMessage(chatId, "assistant", response.message.content)
        }
    }
}

const llm_instance = new LLMInterface()
await llm_instance.instantiateOL()

let llm = writable(llm_instance)

export default llm
