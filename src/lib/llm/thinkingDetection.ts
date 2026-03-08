/**
 * Reusable thinking detection logic for LLM drivers
 * Detects thinking/reasoning tokens from various LLM providers (Ollama, OpenAI, Qwen, etc.)
 */

export interface ThinkingChunk {
    // Standard properties (supported by multiple providers)
    thinking?: string
    reasoning_content?: string
    content?: string | null
}

export interface ThinkingDetectionResult {
    isThinking: boolean
    shouldSkipChunk: boolean
    contentToAppend: string
}

/**
 * Track thinking state across streaming chunks
 */
export class ThinkingDetector {
    private isThinking: boolean = false

    /**
     * Process a chunk and detect thinking state transitions
     * Supports multiple thinking formats:
     * - Ollama: `thinking` property
     * - OpenAI/Qwen: `reasoning_content` property
     * - Tag-based: `<think>`/`</think>` markers in content
     *
     * @param chunk The delta/message chunk from the API
     * @returns Detection result with state and content to append
     */
    processChunk(chunk: ThinkingChunk): ThinkingDetectionResult {
        // Check for thinking state transitions
        // Start thinking if we see <think> tag OR receive thinking/reasoning_content property
        if (
            chunk.content?.toLowerCase() === "<think>" ||
            (chunk.hasOwnProperty("thinking") && !this.isThinking) ||
            (chunk.hasOwnProperty("reasoning_content") && !this.isThinking)
        ) {
            this.isThinking = true
            console.debug("Thinking started...")
            // Skip the <think> marker tag itself
            if (chunk.content?.toLowerCase() === "<think>") {
                return {
                    isThinking: this.isThinking,
                    shouldSkipChunk: true,
                    contentToAppend: "",
                }
            }
        }

        // End thinking if we see </think> tag OR transition from thinking to content
        if (
            chunk.content?.toLowerCase() === "</think>" ||
            (!chunk.hasOwnProperty("thinking") &&
                !chunk.hasOwnProperty("reasoning_content") &&
                this.isThinking &&
                chunk.content)
        ) {
            this.isThinking = false
            console.debug("...thinking ended.")
            // Skip the </think> marker tag itself
            if (chunk.content?.toLowerCase() === "</think>") {
                return {
                    isThinking: this.isThinking,
                    shouldSkipChunk: true,
                    contentToAppend: "",
                }
            }
        }

        // Extract content from appropriate source
        // Priority: thinking > reasoning_content > content
        const contentToAppend = chunk.thinking || chunk.reasoning_content || chunk.content || ""

        return {
            isThinking: this.isThinking,
            shouldSkipChunk: false,
            contentToAppend,
        }
    }

    /**
     * Reset the detector state (useful between requests)
     */
    reset(): void {
        this.isThinking = false
    }

    /**
     * Get current thinking state
     */
    getIsThinking(): boolean {
        return this.isThinking
    }
}
