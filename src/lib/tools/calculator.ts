// Calculator tool
import type { ToolDefinition } from './types'

export const calculatorTool: ToolDefinition = {
    name: 'calculator',
    description: 'Evaluates a mathematical expression and returns the result',
    parameters: {
        expression: {
            type: 'string',
            description: 'Mathematical expression to evaluate (e.g., "2 + 2", "10 * 5")'
        }
    },
    async handler(params) {
        try {
            // Basic safety check - only allow numbers and basic operators
            const expression = params.expression as string
            if (!/^[\d\s+\-*/().]+$/.test(expression)) {
                throw new Error('Invalid expression - only numbers and basic operators (+, -, *, /, parentheses) are allowed')
            }
            // eslint-disable-next-line no-eval
            const result = eval(expression)
            return {
                expression,
                result,
                formatted: `${expression} = ${result}`
            }
        } catch (error) {
            throw new Error(`Calculation error: ${error instanceof Error ? error.message : String(error)}`)
        }
    }
}
