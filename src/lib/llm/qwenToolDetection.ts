/**
 * Qwen tool calling format detector
 * Detects and parses Qwen's XML-based tool calling format:
 * Format 1 (observed): <tool_call> <function=name> {...} </function> </tool_call>
 * Format 2 (documented): <tool_call>\n{"name": "func", "arguments": {...}}\n</tool_call>
 */

export interface QwenToolCall {
    id: string
    type: 'function'
    function: {
        name: string
        arguments: string
    }
}

export interface QwenDetectionResult {
    detectedCalls: QwenToolCall[]
    contentToAppend: string
    isInsideToolCall: boolean
}

/**
 * Track Qwen tool call parsing state across streaming chunks
 */
export class QwenToolDetector {
    private isInsideToolCall: boolean = false
    private toolCallBuffer: string = ""
    private toolCallCounter: number = 0

    /**
     * Process a content chunk and detect Qwen tool call format
     *
     * @param content The content string from the chunk
     * @returns Detection result with parsed calls and stripped content
     */
    processChunk(content: string): QwenDetectionResult {
        if (!content) {
            return {
                detectedCalls: [],
                contentToAppend: content,
                isInsideToolCall: this.isInsideToolCall,
            }
        }

        let detectedCalls: QwenToolCall[] = []
        let processedContent = content

        // Check if entire tool_call block is in this chunk
        if (content.includes('<tool_call>')) {
            const startIdx = content.indexOf('<tool_call>')
            const endIdx = content.indexOf('</tool_call>')

            if (endIdx !== -1 && endIdx > startIdx) {
                // Complete block in one chunk
                console.log('🔧 Qwen tool call block detected (complete)')

                const beforeBlock = content.substring(0, startIdx)
                const blockContent = content.substring(startIdx + '<tool_call>'.length, endIdx)
                const afterBlock = content.substring(endIdx + '</tool_call>'.length)

                // Parse the tool calls
                this.toolCallBuffer = blockContent
                detectedCalls = this.parseToolCallBuffer()
                this.toolCallBuffer = ""

                // Return content without the tool call block
                processedContent = beforeBlock + afterBlock
            } else {
                // Opening tag but no closing tag yet - start buffering
                this.isInsideToolCall = true
                this.toolCallBuffer = ""
                console.log('🔧 Qwen tool call block detected (start)')

                processedContent = content.replace(/<tool_call>/g, '')
                this.toolCallBuffer += processedContent.trim()
                processedContent = "" // Don't display
            }
        } else if (this.isInsideToolCall) {
            // We're continuing to buffer
            if (content.includes('</tool_call>')) {
                // Found closing tag
                this.isInsideToolCall = false
                console.log('🔧 Qwen tool call block detected (end)')

                const endIdx = content.indexOf('</tool_call>')
                const toolCallContent = content.substring(0, endIdx)
                this.toolCallBuffer += toolCallContent

                // Parse the buffered tool calls
                detectedCalls = this.parseToolCallBuffer()
                this.toolCallBuffer = ""

                // Return content after closing tag
                processedContent = content.substring(endIdx + '</tool_call>'.length)
            } else {
                // Still buffering
                this.toolCallBuffer += content
                processedContent = "" // Don't display tool call content
            }
        }

        return {
            detectedCalls,
            contentToAppend: processedContent,
            isInsideToolCall: this.isInsideToolCall,
        }
    }

    /**
     * Parse the buffered tool call content
     * Supports two formats:
     * 1. <function=name> {...} </function> (observed in practice)
     * 2. {"name": "func", "arguments": {...}} per line (documented)
     */
    private parseToolCallBuffer(): QwenToolCall[] {
        const calls: QwenToolCall[] = []
        const buffer = this.toolCallBuffer.trim()

        console.log('🔍 Parsing tool call buffer:', buffer)

        // Try Format 1: <function=name> {...} </function>
        const functionTagRegex = /<function=(\w+)>\s*({.*?})\s*<\/function>/gs
        let match
        let foundWithTags = false

        while ((match = functionTagRegex.exec(buffer)) !== null) {
            foundWithTags = true
            const functionName = match[1]
            const argsJson = match[2]

            console.log(`🔍 Found function tag: ${functionName}, args:`, argsJson)

            try {
                // Validate JSON
                JSON.parse(argsJson)

                const call: QwenToolCall = {
                    id: `qwen_tool_${this.toolCallCounter++}`,
                    type: 'function',
                    function: {
                        name: functionName,
                        arguments: argsJson
                    }
                }
                calls.push(call)
                console.log(`🔧 Qwen tool call parsed (format 1): ${call.function.name}`, call.function.arguments)
            } catch (err) {
                console.warn(`Failed to parse Qwen tool call arguments for ${functionName}:`, argsJson, err)
            }
        }

        console.log(`🔍 Total calls parsed: ${calls.length}`)

        // If no tags found, try Format 2: JSON per line
        if (!foundWithTags) {
            const lines = buffer.split('\n').map(l => l.trim()).filter(l => l.length > 0)

            for (const line of lines) {
                try {
                    const parsed = JSON.parse(line)
                    if (parsed.name) {
                        const call: QwenToolCall = {
                            id: `qwen_tool_${this.toolCallCounter++}`,
                            type: 'function',
                            function: {
                                name: parsed.name,
                                arguments: typeof parsed.arguments === 'string'
                                    ? parsed.arguments
                                    : JSON.stringify(parsed.arguments || {})
                            }
                        }
                        calls.push(call)
                        console.log(`🔧 Qwen tool call parsed (format 2): ${call.function.name}`, call.function.arguments)
                    }
                } catch (err) {
                    console.warn('Failed to parse Qwen tool call JSON:', line, err)
                }
            }
        }

        return calls
    }

    /**
     * Reset the detector state (useful between requests)
     */
    reset(): void {
        this.isInsideToolCall = false
        this.toolCallBuffer = ""
    }

    /**
     * Get current state
     */
    getIsInsideToolCall(): boolean {
        return this.isInsideToolCall
    }
}
