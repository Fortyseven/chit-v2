import { stripFormatting } from "../text/stripFormatting"

/**
 * Detects if a '"' character at the given position within accumulated text
 * is part of a measurement pattern (e.g., 6'10" or 40°12'30").
 */
function isMeasurementQuote(text: string, pos: number): boolean {
    if (pos === 0) return false
    if (!/\d/.test(text[pos - 1])) return false
    let j = pos - 2
    while (j >= 0 && /\d/.test(text[j])) j--
    return j >= 0 && (text[j] === "'" || text[j] === "°")
}

export interface QuoteTTSResult {
    completedQuotes: string[]
    inQuote: boolean
}

/**
 * Detects completed quoted sections during streaming for TTS playback.
 * Tracks quote state across chunks and emits completed quotations.
 * Strips formatting from extracted text before emitting.
 * Measurement patterns like 6'10" or 40°12'30" are ignored.
 */
export class QuoteTTSDetector {
    private inQuote: boolean = false
    private quoteBuffer: string = ""
    private textSoFar: string = ""

    /**
     * Process a streaming chunk and detect completed quotes.
     * @param content Chunk of text from the LLM stream
     * @returns Completed quotes found in this chunk and current state
     */
    processChunk(content: string): QuoteTTSResult {
        if (!content) return { completedQuotes: [], inQuote: this.inQuote }

        const completedQuotes: string[] = []

        for (let i = 0; i < content.length; i++) {
            const ch = content[i]

            if (ch === '"') {
                const absolutePos = this.textSoFar.length + i
                const fullText = this.textSoFar + content

                if (isMeasurementQuote(fullText, absolutePos)) {
                    // Pass through measurement quote into buffer if inside a quote
                    if (this.inQuote) this.quoteBuffer += ch
                } else if (this.inQuote) {
                    // Closing quote — emit completed quote
                    const text = stripFormatting(this.quoteBuffer)
                    if (text.trim()) completedQuotes.push(text)
                    this.quoteBuffer = ""
                    this.inQuote = false
                } else {
                    // Opening quote
                    this.inQuote = true
                    this.quoteBuffer = ""
                }
            } else if (this.inQuote) {
                this.quoteBuffer += ch
            }
        }

        this.textSoFar += content

        return { completedQuotes, inQuote: this.inQuote }
    }

    /**
     * Flush any open quote at end of stream.
     * Called when streaming ends to speak incomplete trailing quotations.
     */
    flush(): string[] {
        if (this.inQuote && this.quoteBuffer.trim()) {
            const text = stripFormatting(this.quoteBuffer)
            this.inQuote = false
            this.quoteBuffer = ""
            return text.trim() ? [text] : []
        }
        return []
    }

    /**
     * Reset detector state between requests.
     */
    reset(): void {
        this.inQuote = false
        this.quoteBuffer = ""
        this.textSoFar = ""
    }
}
