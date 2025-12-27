export type GenericMessage = {
    role: "system" | "user" | "assistant"
    content: string
    images?: string[]
}

export interface ChatConfig {
    temp?: number
    ctx?: number
    stream?: boolean
}

export interface LLMDriver {
    abort(): void
    refreshModels(): Promise<void>
    listModels(): any[]

    chat(
        chatId: string,
        messages: GenericMessage[],
        model: string,
        config: ChatConfig
    ): Promise<void | string>

    chatFormatted(
        messages: GenericMessage[],
        model: string,
        format: any,
        config: ChatConfig
    ): Promise<string>

    kind(): "ollama" | "openai"
}
