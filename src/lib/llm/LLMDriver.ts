export type GenericMessage = {
    role: "system" | "user" | "assistant"
    content: string
    images?: string[]
}

export interface ChatConfig {
    temp?: number
    ctx?: number
    stream?: boolean
    enable_thinking?: boolean
    top_p?: number
    presence_penalty?: number
    repeat_penalty?: number
    top_k?: number
    seed?: number
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
