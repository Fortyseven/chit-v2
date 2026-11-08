// Tool definition interface

export interface ToolContext {
    chatId: string
}

export interface ToolDefinition {
    name: string
    description: string
    parameters: Record<string, any>
    /**
     * Param names required by the function schema. Defaults to all
     * parameter names (legacy behavior); set explicitly when some
     * parameters are optional.
     */
    required?: string[]
    handler: (params: Record<string, any>, context?: ToolContext) => Promise<any>
}
