export type GenericMessage = {
    role: "system" | "user" | "assistant"
    content: string
    images?: string[]
}

export interface LLMDriver {
    abort(): void
    refreshModels(): Promise<void>
    listModels(): any[]

    chat(
        chatId: string,
        messages: GenericMessage[],
        model: string,
        temp?: number,
        ctx?: number
    ): Promise<void>

    chatFormatted(
        messages: GenericMessage[],
        model: string,
        format: any,
        temp?: number,
        ctx?: number
    ): Promise<void>

    kind(): "ollama" | "openai"
}
