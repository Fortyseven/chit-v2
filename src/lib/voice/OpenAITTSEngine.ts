import { SpeakOptions, TTSEngine, TTSEngineMeta } from "./TTSEngine"

export class OpenAITTSEngine implements TTSEngine {
    meta: TTSEngineMeta = {
        id: "openai",
        name: "OpenAI TTS",
        description: "OpenAI text-to-speech API",
        supportsVoices: true,
        supportsBoundaryEvents: false,
    }

    private apiEndpoint: string
    private apiKey: string | null
    private currentAudioElement: HTMLAudioElement | null = null
    private speaking = false
    private abortController: AbortController | null = null

    constructor(endpoint: string, apiKey: string | null = null) {
        this.apiEndpoint = endpoint
        this.apiKey = apiKey
    }

    /**
     * Query available voices from OpenAI TTS endpoint
     */
    async listVoices() {
        try {
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            }
            if (this.apiKey) {
                headers.Authorization = `Bearer ${this.apiKey}`
            }

            const response = await fetch(`${this.apiEndpoint}/v1/audio/voices`, {
                method: "GET",
                headers,
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()
            // OpenAI returns { voices: [...] }
            const voices = Array.isArray(data.voices) ? data.voices : []
            return voices.map((v: any) => ({
                id: v.id || v.name,
                name: v.name || v.id,
            }))
        } catch (e) {
            console.error("OpenAITTSEngine.listVoices error", e)
            throw e
        }
    }

    isSpeaking() {
        return this.speaking
    }

    stop() {
        if (this.currentAudioElement) {
            try {
                this.currentAudioElement.pause()
                this.currentAudioElement.currentTime = 0
            } catch (e) {
                console.warn("OpenAITTSEngine.stop error", e)
            }
            this.currentAudioElement = null
        }
        if (this.abortController) {
            this.abortController.abort()
            this.abortController = null
        }
        this.speaking = false
    }

    async speak(opts: SpeakOptions) {
        this.stop() // interrupt any prior
        if (!opts.text || !opts.text.trim()) return

        this.abortController = new AbortController()

        try {
            this.speaking = true
            opts.onStart && opts.onStart()

            // Call OpenAI TTS API
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            }
            if (this.apiKey) {
                headers.Authorization = `Bearer ${this.apiKey}`
            }

            const response = await fetch(`${this.apiEndpoint}/v1/audio/speech`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    model: "tts-1",
                    input: opts.text,
                    voice: opts.voice || "alloy",
                    speed: opts.rate || 1,
                }),
                signal: this.abortController.signal,
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const audioBlob = await response.blob()
            const audioUrl = URL.createObjectURL(audioBlob)

            // Create audio element and play
            this.currentAudioElement = new Audio(audioUrl)
            this.currentAudioElement.volume =
                opts.volume === undefined ? 1 : opts.volume

            this.currentAudioElement.onended = () => {
                this.speaking = false
                opts.onEnd && opts.onEnd()
                this.currentAudioElement = null
                URL.revokeObjectURL(audioUrl)
            }

            this.currentAudioElement.onerror = (e) => {
                this.speaking = false
                opts.onError && opts.onError(e)
                this.currentAudioElement = null
                URL.revokeObjectURL(audioUrl)
            }

            await this.currentAudioElement.play()
        } catch (e) {
            if (e instanceof DOMException && e.name === "AbortError") {
                // Aborted by stop() call, silent exit
                return
            }
            this.speaking = false
            opts.onError && opts.onError(e)
            this.currentAudioElement = null
            console.error("OpenAITTSEngine.speak error", e)
        }
    }
}

export function createOpenAITTSEngine(endpoint: string, apiKey: string | null = null) {
    return new OpenAITTSEngine(endpoint, apiKey)
}
