// Image generation tool - uses the configured Media Server
import { ChatMediaType, createMediaAttachment } from '../chatSession/chatAttachments'
import { b64ToBlob, generateImage, getMediaServerUrl } from '../mediaServer/mediaServer'
import { addStreamingMedia } from '../chatSession/streamingState'
import type { ToolDefinition } from './types'

export const generateImageTool: ToolDefinition = {
    name: 'generate_image',
    description: 'Generate one or more images from a text prompt using the media server',
    parameters: {
        prompt: {
            type: 'string',
            description: 'Text description of the image to generate (e.g., "a sunset over mountains", "a cat wearing a hat")'
        },
        size: {
            type: 'string',
            description: 'Image dimensions, e.g. "1024x1024", "1024x1792", "1792x1024"'
        },
    },
    async handler(params, context) {
        const prompt = params.prompt as string
        if (!prompt || prompt.trim().length === 0) {
            throw new Error('Prompt is required')
        }

        const options: Record<string, any> = {}
        if (params.size) options.size = params.size as string

        const response = await generateImage(prompt.trim(), options, getMediaServerUrl())

        // Add generated images to the streaming media buffer so they
        // get attached to the assistant's message in the conversation.
        // Do NOT use chatAddPastedMedia — that puts them in the input box.
        if (response.data.length > 0) {
            for (const img of response.data) {
                const blob = b64ToBlob(img.b64_json)
                const attachment = createMediaAttachment(
                    blob,
                    ChatMediaType.IMAGE,
                    'generated_image.png'
                )
                addStreamingMedia(attachment)
            }
        }

        // Return metadata only — do NOT include b64_json in the result.
        // The full base64 would be stringified into the tool response text,
        // blowing the context window.
        return {
            created: response.created,
            revised_prompt: response.data[0]?.revised_prompt,
            count: response.data.length,
        }
    }
}
