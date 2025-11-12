import { SpeakOptions, TTSEngine, TTSEngineMeta } from "./TTSEngine"

// Lazy voice cache so we don't query repeatedly.
let cachedVoices: SpeechSynthesisVoice[] | null = null
function getVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
        const synth = window.speechSynthesis
        const voices = synth.getVoices()
        if (voices && voices.length) {
            cachedVoices = voices
            resolve(voices)
            return
        }
        synth.onvoiceschanged = () => {
            const v = synth.getVoices()
            cachedVoices = v
            resolve(v)
        }
    })
}

export class WebSpeechEngine implements TTSEngine {
    meta: TTSEngineMeta = {
        id: "webspeech",
        name: "Browser Web Speech",
        description: "Native browser SpeechSynthesis API",
        supportsVoices: true,
        supportsBoundaryEvents: true,
    }

    private currentUtterance: SpeechSynthesisUtterance | null = null
    private speaking = false

    async listVoices() {
        const voices = cachedVoices || (await getVoices())
        return voices.map((v) => ({ id: v.name, name: v.name, lang: v.lang }))
    }

    isSpeaking() {
        return this.speaking
    }

    stop() {
        if (this.currentUtterance) {
            try {
                window.speechSynthesis.cancel()
            } catch (e) {
                console.warn("WebSpeechEngine.cancel error", e)
            }
            this.currentUtterance = null
            this.speaking = false
        }
    }

    async speak(opts: SpeakOptions) {
        this.stop() // interrupt any prior
        if (!opts.text || !opts.text.trim()) return

        const utter = new SpeechSynthesisUtterance(opts.text)
        utter.rate = opts.rate || 1
        utter.pitch = opts.pitch || 1
        utter.volume = opts.volume === undefined ? 1 : opts.volume
        if (opts.lang) utter.lang = opts.lang

        if (opts.voice) {
            const voices = cachedVoices || (await getVoices())
            const found = voices.find((v) => v.name === opts.voice)
            if (found) utter.voice = found
        }

        utter.onstart = () => {
            this.speaking = true
            opts.onStart && opts.onStart()
        }
        utter.onend = () => {
            this.speaking = false
            opts.onEnd && opts.onEnd()
            this.currentUtterance = null
        }
        utter.onerror = (e) => {
            this.speaking = false
            opts.onError && opts.onError(e)
            this.currentUtterance = null
        }
        utter.onboundary = (ev) => {
            if (typeof opts.onBoundary === "function") {
                // ev.charIndex is available in some browsers
                opts.onBoundary(ev.charIndex || 0)
            }
        }

        this.currentUtterance = utter
        window.speechSynthesis.speak(utter)
    }
}

export function createWebSpeechEngine() {
    return new WebSpeechEngine()
}
