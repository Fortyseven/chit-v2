// Ask questions tool
import { askQuestion } from './questionDialog';
import type { ToolDefinition } from './types';

export interface AskQuestionsParams {
    question: string
    options?: Array<{ label: string; value: string }>
    allowFreeform?: boolean
}

export const askQuestionsTool: ToolDefinition = {
    name: 'ask_questions',
    description: 'Ask the user a question with optional multiple choice answers or freeform response',
    parameters: {
        question: {
            type: 'string',
            description: 'The question to ask the user'
        },
        options: {
            type: 'array',
            description: 'Optional array of answer choices. Each option should have "label" (display text) and "value" (what gets returned). If empty, user can provide freeform response.',
            items: {
                type: 'object',
                properties: {
                    label: { type: 'string', description: 'Display text for this option' },
                    value: { type: 'string', description: 'Value to return if user selects this option' }
                }
            }
        },
        allowFreeform: {
            type: 'boolean',
            description: 'If true and options are provided, adds a freeform input option as the last choice (defaults to true)'
        }
    },
    async handler(params) {
        try {
            const question = params.question as string
            let options = (params.options as AskQuestionsParams['options']) || []
            const allowFreeform = params.allowFreeform !== false

            if (!question) {
                throw new Error('Question is required')
            }

            // If options are provided and freeform is allowed, add a freeform option at the end
            if (options && options.length > 0 && allowFreeform) {
                options = [...options, { label: 'Other (enter your own answer)', value: '__freeform__' }]
            }

            const answer = await askQuestion(question, options)

            if (!answer) {
                throw new Error('Question was cancelled by user')
            }

            return {
                success: true,
                question,
                answer,
                choices: options.length > 0 ? options.filter(o => o.value !== '__freeform__').length : 0
            }
        } catch (error) {
            throw new Error(`Failed to ask question: ${error instanceof Error ? error.message : String(error)}`)
        }
    }
}
