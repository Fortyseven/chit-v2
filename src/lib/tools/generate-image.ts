// Image generation tool - uses the configured Media Server
import type { ToolDefinition } from './types'
import { generateImage, getMediaServerUrl } from '../mediaServer/mediaServer'

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
        n: {
            type: 'number',
            description: 'Number of images to generate (1-4)'
        },
        quality: {
            type: 'string',
            description: 'Image quality: "standard" or "hd"'
        },
        model: {
            type: 'string',
            description: 'Image generation model to use (e.g., "dall-e-3", "flux")'
        }
    },
    async handler(params) {
        const prompt = params.prompt as string
        if (!prompt || prompt.trim().length === 0) {
            throw new Error('Prompt is required')
        }

        const options: Record<string, any> = {}
        if (params.n) options.n = Math.min(Math.max(Number(params.n), 1), 4)
        if (params.size) options.size = params.size as string
        if (params.quality) options.quality = params.quality as string
        if (params.model) options.model = params.model as string

        const response = await generateImage(prompt.trim(), options, getMediaServerUrl())

        return {
            created: response.created,
            revised_prompt: response.data[0]?.revised_prompt,
            images: response.data.map((img, i) => ({
                index: i,
                b64_json: img.b64_json
            }))
        }
    }
}
