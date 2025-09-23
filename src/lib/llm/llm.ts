import { get, Writable, writable } from "svelte/store"
import { appState } from "../appState/appState"
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
import type { GenericMessage, LLMDriver } from "./LLMDriver"
import { OllamaDriver } from "./OllamaDriver"
import { OpenAIDriver } from "./OpenAIDriver"

// Shared models store (either ModelResponse[] or string[])
export const llmModels: Writable<Array<any>> = writable([])

export class LLMInterface {
    driver: Writable<LLMDriver | undefined> = writable(undefined)
    firstLoad = true

    async init() {
        const state = get(appState)
        const wantOpenAI = Boolean(state.openaiApiBase && state.openaiApiKey)
        const wantOllama =
            typeof state.chatApiEndpoint === "string" &&
            state.chatApiEndpoint.trim() !== ""

        if (wantOpenAI) {
            this.driver.set(
                new OpenAIDriver(state.openaiApiBase, state.openaiApiKey)
            )
        } else if (wantOllama) {
            this.driver.set(new OllamaDriver(state.chatApiEndpoint))
        } else {
            console.warn("LLM: No endpoints configured; models will be empty")
            this.driver.set(undefined)
            llmModels.set([])
            return
        }

        try {
            await get(this.driver)?.refreshModels()
            const models = get(this.driver)?.listModels() || []
            llmModels.set(models as any)
        } catch (e) {
            console.error("LLM init refreshModels error:", e)
            llmModels.set([])
        }
        this.firstLoad = false
    }

    async refreshModelList() {
        const d = get(this.driver)
        if (!d) {
            llmModels.set([])
            return
        }
        await d.refreshModels()
        const models = d.listModels() as any
        llmModels.set(models)
    }

    listModels() {
        return get(this.driver)?.listModels()
    }

    async chatUpdateSession(chatId: string) {
        const backpackApi = get(appState).backpackApiEndpoint
        const chat_session = chatFind(chatId)
        if (!chat_session) {
            console.error("Chat session not found: " + chatId)
            return
        }

        chatStart(chatId)

        let system_prompt = ""
        let processed_final_sprompt = ""

        if (chat_session.systemPrompt?.trim()) {
            system_prompt = chat_session.systemPrompt.trim()
        } else {
            system_prompt = get(appState).defaultPrompt.trim()
        }

        if (system_prompt) {
            processed_final_sprompt =
                applyUserVariables(applySystemVariables(system_prompt)) || ""
        }

        let backpack_context: string | undefined = ""
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
        }

        const messages: GenericMessage[] = []
        if (processed_final_sprompt) {
            messages.push({
                role: "system",
                content: [processed_final_sprompt, backpack_context].join("\n"),
            })
        }

        for (const message of chat_session.messages) {
            let msg = message.content.trim()
            const images: string[] = []

            if (message.media && message.media.length > 0) {
                for (const media of message.media) {
                    if (media.type == ChatMediaType.IMAGE) {
                        const img64 = await convertFileToBase64(
                            media.data as Blob
                        )
                        images.push(img64 as string)
                    } else if (media.type == ChatMediaType.TEXT && media.data) {
                        msg +=
                            "\n\n```\n" +
                            (media.data as string).trim() +
                            "\n```\n"
                    }
                }
            }

            messages.push({
                role: message.role,
                content: msg,
                images,
            })
        }

        const driver = get(this.driver)
        if (!driver) {
            console.error("LLM driver not initialized")
            return
        }

        const temp = chat_session.settings?.temperature || DEFAULT_TEMPERATURE
        const ctx = chat_session.settings?.num_ctx || DEFAULT_CONTEXT

        await driver.chat(
            chatId,
            messages,
            chat_session.model_name as string,
            temp,
            ctx
        )
    }
}

const llm_instance = new LLMInterface()
await llm_instance.init()

let lastKey = ""
appState.subscribe(async (state) => {
    const key = [
        state.chatApiEndpoint || "",
        state.openaiApiBase || "",
        state.openaiApiKey ? "set" : "",
    ].join("|")
    if (key !== lastKey) {
        lastKey = key
        await llm_instance.init()
    }
})

let llm: Writable<LLMInterface> = writable(llm_instance)
export default llm
