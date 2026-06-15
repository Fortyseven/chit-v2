// Tool definition interface

export interface ToolContext {
    chatId: string
}

export interface ToolDefinition {
    name: string
    description: string
    parameters: Record<string, any>
    handler: (params: Record<string, any>, context?: ToolContext) => Promise<any>
}
