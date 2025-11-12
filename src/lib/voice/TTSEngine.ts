export interface SpeakOptions {
    text: string
    voice?: string // voice name/id
    rate?: number
    pitch?: number
    volume?: number
    lang?: string
    onStart?: () => void
    onEnd?: () => void
    onError?: (e: any) => void
    onBoundary?: (charIndex: number) => void
}

export interface TTSEngineMeta {
    id: string
    name: string
    description?: string
    supportsVoices: boolean
    supportsBoundaryEvents: boolean
}

export interface TTSEngine {
    meta: TTSEngineMeta
    listVoices(): Promise<Array<{ id: string; name: string; lang?: string }>>
    speak(opts: SpeakOptions): Promise<void>
    stop(): void
    isSpeaking(): boolean
}
