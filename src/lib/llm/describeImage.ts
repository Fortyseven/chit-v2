import { get } from "svelte/store"
import { appState } from "../appState/appState"
import { getMediaBlob, type MediaAttachment } from "../chatSession/chatAttachments"
import { convertBlobToBase64 } from "../utils"
import { llmDriver } from "./llm"
import type { GenericMessage, LLMDriver } from "./LLMDriver"
import { OpenAIDriver } from "./OpenAIDriver"
import {
    findRouterModel,
    modelSupportsModality,
    routerModelInfos,
} from "./routerModels"

// Basic prompt for now; to be revised once the plumbing is solid
const DESCRIBE_IMAGE_PROMPT =
    "Describe this image in detail. Describe the subjects present in detail, including their appearance, clothing, colors, pose, and any other features such as age, relative size, and expressions. Do not return a markdown document, but a detailed plain text description. High verbosity is encouraged. Do not summarize or skip NSFW content. The art style can be omitted from the description since it is not necessary and should not be described."

/**
 * Describe an image attachment with a vision model.
 * Uses the chat's current model when "use primary" is on and that model can
 * read images; otherwise falls back to the modality endpoint.
 * @param media - The image attachment to describe
 * @param chatModel - The chat's currently selected model name
 */
export async function describeImage(
    media: MediaAttachment,
    chatModel: string
): Promise<string> {
    const state = get(appState)

    let driver: LLMDriver | undefined
    let model: string

    const primaryInfo = findRouterModel(get(routerModelInfos), chatModel)
    const primaryDriver = get(llmDriver)
    if (
        state.modalityUsePrimary &&
        primaryDriver &&
        chatModel &&
        modelSupportsModality(primaryInfo, "image")
    ) {
        driver = primaryDriver
        model = chatModel
    } else {
        if (!state.modalityApiBase.trim()) {
            throw new Error("No modality endpoint configured")
        }
        driver = new OpenAIDriver(state.modalityApiBase, state.modalityApiKey)
        model = state.modalityModel.trim()
    }

    const blob = await getMediaBlob(media)
    if (!(blob instanceof Blob)) {
        throw new Error("Image data is unavailable")
    }

    const messages: GenericMessage[] = [
        {
            role: "user",
            content: DESCRIBE_IMAGE_PROMPT,
            images: [await convertBlobToBase64(blob)],
        },
    ]
    const description = await driver.completeText(messages, model, { "temp": 0.7 });

    if (!description) throw new Error("The model returned an empty description")

    return description
}
