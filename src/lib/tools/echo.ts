// Example tool: echo
import type { ToolDefinition } from './types'

export const echoTool: ToolDefinition = {
    name: 'echo',
    description: 'Echoes back the input text',
    parameters: {
        text: {
            type: 'string',
            description: 'Text to echo'
        }
    },
    async handler(params) {
        return {
            echo: params.text,
            message: `You said: ${params.text}`
        }
    }
}
