/**
 * Estimates token count from character count using the commonly cited
 * ~4 characters per token approximation (OpenAI rule of thumb for English text).
 * Returns a float — callers should round for display.
 */
export function estimateTokens(charCount: number): number {
    return charCount / 4
}
