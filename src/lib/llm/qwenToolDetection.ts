/**
 * Qwen tool calling format detector
 * Detects and parses Qwen's XML-based tool calling format:
 *
 * Format 1 (JSON with closing tags):
 *   <tool_call> <function=name> {...} </function> </tool_call>
 *
 * Format 2 (documented JSON):
 *   <tool_call>\n{"name": "func", "arguments": {...}}\n</tool_call>
 *
 * Format 3 (parameter tags with closing):
 *   <tool_call> <function=name> <parameter=key> value </parameter> </function> </tool_call>
 *
 * Format 4 (simple parameter tags):
 *   <tool_call> <function=name> <parameter=key> value </tool_call>
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

        // Check if entire tool_call block is in this chunk (case-insensitive)
        const toolCallStartRegex = /<tool_call>/i
        const toolCallEndRegex = /<\/tool_call>/i
        const hasToolCallStart = toolCallStartRegex.test(content)
        const hasToolCallEnd = toolCallEndRegex.test(content)

        if (hasToolCallStart) {
            const startMatch = content.match(toolCallStartRegex)
            const startIdx = startMatch ? content.indexOf(startMatch[0]) : -1
            const endMatch = content.match(toolCallEndRegex)
            const endIdx = endMatch ? content.indexOf(endMatch[0]) : -1

            if (endIdx !== -1 && endIdx > startIdx && startIdx !== -1) {
                // Complete block in one chunk
                console.log('🔧 Qwen tool call block detected (complete)')
                console.log('🔍 Raw content:', JSON.stringify(content))

                const startTag = startMatch![0]
                const endTag = endMatch![0]
                const beforeBlock = content.substring(0, startIdx)
                const blockContent = content.substring(startIdx + startTag.length, endIdx)
                const afterBlock = content.substring(endIdx + endTag.length)

                console.log('🔍 Block content to parse:', JSON.stringify(blockContent))
                console.log('🔍 Before block:', JSON.stringify(beforeBlock))
                console.log('🔍 After block:', JSON.stringify(afterBlock))

                // Parse the tool calls
                this.toolCallBuffer = blockContent
                detectedCalls = this.parseToolCallBuffer()
                this.toolCallBuffer = ""

                console.log('🔍 Detected calls:', detectedCalls.length)

                // Return content without the tool call block
                processedContent = beforeBlock + afterBlock
                console.log('🔍 Processed content (stripped):', JSON.stringify(processedContent))
            } else {
                // Opening tag but no closing tag yet - start buffering
                this.isInsideToolCall = true
                this.toolCallBuffer = ""
                console.log('🔧 Qwen tool call block detected (start)')

                const startTag = startMatch![0]
                // Remove the opening tag and buffer everything after it
                const afterStartTag = content.substring(startIdx + startTag.length)
                this.toolCallBuffer += afterStartTag.trim()
                processedContent = "" // Don't display
            }
        } else if (this.isInsideToolCall) {
            // We're continuing to buffer
            if (hasToolCallEnd) {
                // Found closing tag
                this.isInsideToolCall = false
                console.log('🔧 Qwen tool call block detected (end)')

                const endMatch = content.match(toolCallEndRegex)
                const endIdx = endMatch ? content.indexOf(endMatch[0]) : -1
                const toolCallContent = content.substring(0, endIdx)
                this.toolCallBuffer += toolCallContent

                // Parse the buffered tool calls
                detectedCalls = this.parseToolCallBuffer()
                this.toolCallBuffer = ""

                // Return content after closing tag
                const endTag = endMatch![0]
                processedContent = content.substring(endIdx + endTag.length)
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
     * Supports three formats:
     * 1. <function=name> {...} </function> (observed in practice)
     * 2. {"name": "func", "arguments": {...}} per line (documented)
     * 3. <function=name> <parameter=key> value </parameter> </function> (parameter tags with closing)
     * 4. <function=name> <parameter=key> value (simple parameter tags without closing)
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

        // Try Format 3: <function=name> <parameter=key> value </parameter> </function>
        if (!foundWithTags) {
            const functionParamRegex = /<function=(\w+)>([\s\S]*?)<\/function>/gs
            const paramRegex = /<parameter=(\w+)>\s*([\s\S]*?)\s*<\/parameter>/g

            let funcMatch
            while ((funcMatch = functionParamRegex.exec(buffer)) !== null) {
                foundWithTags = true
                const functionName = funcMatch[1]
                const functionContent = funcMatch[2]

                console.log(`🔍 Found function tag (format 3): ${functionName}`)

                const args: Record<string, string> = {}
                let paramMatch

                while ((paramMatch = paramRegex.exec(functionContent)) !== null) {
                    const paramName = paramMatch[1]
                    const paramValue = paramMatch[2].trim()
                    args[paramName] = paramValue
                    console.log(`🔍 Found parameter: ${paramName} = ${paramValue}`)
                }

                if (Object.keys(args).length > 0) {
                    const call: QwenToolCall = {
                        id: `qwen_tool_${this.toolCallCounter++}`,
                        type: 'function',
                        function: {
                            name: functionName,
                            arguments: JSON.stringify(args)
                        }
                    }
                    calls.push(call)
                    console.log(`🔧 Qwen tool call parsed (format 3): ${call.function.name}`, call.function.arguments)
                }
            }
        }

        // Try Format 4: <function=name> <parameter=key> value (simple tags without closing)
        if (!foundWithTags) {
            const simpleFunctionMatch = buffer.match(/<function=(\w+)>/i);
            if (simpleFunctionMatch) {
                foundWithTags = true;
                const functionName = simpleFunctionMatch[1];
                console.log(`🔍 Found function tag (format 4): ${functionName}`);
                console.log(`🔍 Full buffer for Format 4:`, JSON.stringify(buffer));

                const args: Record<string, string> = {};

                // Extract all parameters - split on <parameter= tags
                const paramSections = buffer.split(/<parameter=/i);

                for (let i = 1; i < paramSections.length; i++) {
                    const section = paramSections[i];
                    console.log(`🔍 Processing parameter section ${i}:`, JSON.stringify(section.substring(0, 100)));

                    // Extract: paramName> value (everything after >)
                    const match = section.match(/^(\w+)>\s*([\s\S]*)/);
                    if (match) {
                        const paramName = match[1];
                        let paramValue = match[2];

                        // Clean up: remove any XML-like tags that might appear at the end
                        // This handles cases like: "Mine now. </tool_call>" or "Mine now. </"
                        paramValue = paramValue.replace(/<[^>]*>[\s\S]*$/g, '').trim();

                        if (paramValue) {
                            args[paramName] = paramValue;
                            console.log(`🔍 Found parameter: ${paramName} = ${JSON.stringify(paramValue)}`);
                        } else {
                            console.log(`⚠️ Parameter ${paramName} has empty value after cleaning`);
                        }
                    } else {
                        console.log(`⚠️ Could not parse parameter section: ${JSON.stringify(section.substring(0, 50))}`);
                    }
                }

                // Always create a call, even with empty args (might be incomplete buffer)
                const call: QwenToolCall = {
                    id: `qwen_tool_${this.toolCallCounter++}`,
                    type: 'function',
                    function: {
                        name: functionName,
                        arguments: JSON.stringify(args)
                    }
                };
                calls.push(call);
                console.log(`🔧 Qwen tool call parsed (format 4): ${call.function.name}`, call.function.arguments);
            } else {
                console.log('🔍 Format 4: No <function=...> tag found in buffer:', JSON.stringify(buffer.substring(0, 100)));
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
     * Flush any remaining buffered content at end of stream
     * This handles cases where the stream ends while we're still buffering a tool call
     */
    flush(): QwenToolCall[] {
        if (!this.isInsideToolCall || !this.toolCallBuffer.trim()) {
            return []
        }

        console.log('🔧 Flushing remaining Qwen tool call buffer at end of stream')

        // Parse what we have, even without the closing tag
        const calls = this.parseToolCallBuffer()

        // Clear state
        this.isInsideToolCall = false
        this.toolCallBuffer = ""

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
