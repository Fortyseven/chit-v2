import { ChatRequest, Message, ModelResponse, Ollama } from "ollama/browser"
import { get, Writable, writable } from "svelte/store"
import { appState } from "../appState/appState"
import { sndPlayResponse, sndPlayTyping, sndStopTyping } from "../audio"
import {
    chatAppendStreamingPending,
    chatFind,
    chatFinish,
    chatInProgress,
    chatPromoteStreamingPending,
    chatSetWasAborted,
    chatStart,
    DEFAULT_CONTEXT,
    DEFAULT_TEMPERATURE,
} from "../chatSession/chatActions"
import { ChatMediaType } from "../chatSession/chatAttachments"
import {
    applySystemVariables,
    applyUserVariables,
} from "../templating/templating"
import { convertBlobToBase64 as convertFileToBase64 } from "../utils"

export class LLMInterface {
    models: Writable<ModelResponse[]> = writable([])
    ol_instance: Writable<Ollama | undefined> = writable(undefined)
    ol_instance_host: Writable<string> = writable("")
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
                get(this.ol_instance_host) !== get(appState).chatApiEndpoint
            ) {
                this.ol_instance.set(
                    new Ollama({
                        host: get(appState).chatApiEndpoint as string,
                    })
                )
                this.ol_instance_host.set(get(appState).chatApiEndpoint)

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
    async chatUpdateSession(chatId: string) {
        const backpackApi = get(appState).backpackApiEndpoint
        let chat_session = chatFind(chatId)

        if (!chat_session) {
            console.error("Chat session not found: " + chatId)
            return
        }

        chatStart(chatId)

        let messages: Message[] = []

        let final_sprompt =
            applyUserVariables(
                applySystemVariables(chat_session.systemPrompt as string)
            ) || ""

        let backpack_context: string = ""

        if (backpackApi) {
            backpack_context = chat_session.backpackReferences
                ?.map((ref) => {
                    return `TOOL: ${ref.toolId}\nURL: ${
                        ref.referenceUrl
                    }\nCONTEXT:\n${ref.referenceContent.trim()}`
                })
                .join("\n#####\n")

            backpack_context =
                "EXTERNAL CONTEXT START:\n" +
                backpack_context +
                "EXTERNAL CONTEXT END\n"

            console.log("REFERENCES ATTACHED", backpack_context)
        }

        if (final_sprompt) {
            // ---- System prompt ----
            messages.push({
                role: "system",
                content: [final_sprompt, backpack_context].join("\n"),
            })
        }

        // ---- User prompt ----
        for (let message of chat_session.messages) {
            let msg = message.content.trim()

            let images: string[] = []

            if (message.media && message.media.length > 0) {
                for (let i = 0; i < message.media.length; i++) {
                    let media = message.media[i]
                    if (media.type == ChatMediaType.IMAGE) {
                        // convert blob to base64
                        let img64 = await convertFileToBase64(media.data)
                        images.push(img64 as string)
                    } else if (media.type == ChatMediaType.TEXT && media.data) {
                        msg += "\n\n```\n" + media.data.trim() + "\n```\n"
                    }
                }
            }

            messages.push({
                role: message.role,
                content: msg as string,
                images,
            })
        }

        console.log("🤖📡 Submitting chat session:", messages)

        // ---- setup ollama call ----
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
                chatPromoteStreamingPending(chatId)
                chatInProgress.set(false)
                sndStopTyping()
                sndPlayResponse()
                chatFinish(chatId)
            }
        }
    }
}

const llm_instance = new LLMInterface()
await llm_instance.instantiateOL()

appState.subscribe((state) => {
    if (state.chatApiEndpoint !== get(llm_instance.ol_instance_host)) {
        llm_instance.instantiateOL()
    }
})

let llm: Writable<LLMInterface> = writable(llm_instance)

export default llm
