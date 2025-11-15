/**
 * Streaming-safe quote wrapper.
 * Transforms pairs of double quotes into spans wrapping the inner text.
 * Opening: '"' => '"<span class="quote">', Closing: '"' => '</span>"'.
 * If an input ends inside an open quote (unclosed), the span remains open so
 * subsequent appended content can continue being quoted until the next '"'.
 */
export function wrapQuotesStreaming(input: string): string {
    if (!input) return ""
    let inQuote = false
    let out = ""
    for (let i = 0; i < input.length; i++) {
        const ch = input[i]
        if (ch === '"') {
            if (inQuote) {
                out += '</span>"'
                inQuote = false
            } else {
                out += '"<span class="quote">'
                inQuote = true
            }
        } else {
            out += ch
        }
    }
    return out
}

/**
 * Incremental chunk processor variant. Maintains external mutable state so
 * caller can feed streaming chunks without re-walking the entire buffer.
 */
export function wrapQuotesChunk(
    chunk: string,
    state: { inQuote: boolean }
): { output: string; inQuote: boolean } {
    if (!chunk) return { output: "", inQuote: state.inQuote }
    let out = ""
    for (let i = 0; i < chunk.length; i++) {
        const ch = chunk[i]
        if (ch === '"') {
            if (state.inQuote) {
                out += '</span>"'
                state.inQuote = false
            } else {
                out += '"<span class="quote">'
                state.inQuote = true
            }
        } else {
            out += ch
        }
    }
    return { output: out, inQuote: state.inQuote }
}
