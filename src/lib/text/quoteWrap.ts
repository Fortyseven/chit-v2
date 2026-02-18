/**
 * Detects if a '"' character at the given position is part of a measurement
 * pattern (e.g., heights like 6'10" or coordinates like 40°12'30").
 */
function isMeasurementQuote(input: string, pos: number): boolean {
    if (pos === 0) return false
    // Check if '"' is preceded by a digit
    if (!/\d/.test(input[pos - 1])) return false
    // Look back to find if there's a ' or ° before the digits
    let j = pos - 2
    while (j >= 0 && /\d/.test(input[j])) {
        j--
    }
    // If we found a ' or °, this is a measurement quote
    if (j >= 0 && (input[j] === "'" || input[j] === "°")) {
        return true
    }
    return false
}

/**
 * Streaming-safe quote wrapper.
 * Transforms pairs of double quotes into spans wrapping the inner text.
 * Opening: '"' => '"<span class="quote">', Closing: '"' => '</span>"'.
 * If an input ends inside an open quote (unclosed), the span remains open so
 * subsequent appended content can continue being quoted until the next '"'.
 * Measurement patterns like 6'10" or 40°12'30" are left unchanged.
 */
export function wrapQuotesStreaming(input: string): string {
    if (!input) return ""
    let inQuote = false
    let out = ""
    for (let i = 0; i < input.length; i++) {
        const ch = input[i]
        if (ch === '"' && !isMeasurementQuote(input, i)) {
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
 * Measurement patterns like 6'10" or 40°12'30" are left unchanged.
 */
export function wrapQuotesChunk(
    chunk: string,
    state: { inQuote: boolean }
): { output: string; inQuote: boolean } {
    if (!chunk) return { output: "", inQuote: state.inQuote }
    let out = ""
    for (let i = 0; i < chunk.length; i++) {
        const ch = chunk[i]
        if (ch === '"' && !isMeasurementQuote(chunk, i)) {
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
