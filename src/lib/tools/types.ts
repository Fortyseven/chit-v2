// Tool definition interface

export interface ToolDefinition {
    name: string
    description: string
    parameters: Record<string, any>
    handler: (params: Record<string, any>) => Promise<any>
}
