// Text-to-speech tool
import { ttsSpeak } from '../voice/tts'
import type { ToolDefinition } from './types'

export const sayTool: ToolDefinition = {
    name: 'say',
    description: 'Speak text aloud using text-to-speech. Use this to give voice to your responses when appropriate.',
    parameters: {
        text: {
            type: 'string',
            description: 'The text to speak aloud'
        }
    },
    async handler(params) {
        const text = params.text as string
        if (!text) {
            throw new Error('No text provided to speak')
        }

        try {
            await ttsSpeak(text, false)
            return {
                success: true,
                message: 'Speaking text aloud',
                length: text.length,
                text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
            }
        } catch (error) {
            throw new Error(`Failed to speak text: ${error instanceof Error ? error.message : String(error)}`)
        }
    }
}
