// Current time tool
import type { ToolDefinition } from './types'

export const timeTool: ToolDefinition = {
    name: 'current_time',
    description: 'Returns the current date and time',
    parameters: {},
    async handler(params) {
        const now = new Date()
        return {
            timestamp: now.toISOString(),
            formatted: now.toLocaleString(),
            unix: Math.floor(now.getTime() / 1000)
        }
    }
}
