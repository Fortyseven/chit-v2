// Tool registry: aggregates all tool modules
// Each tool exports: name, description, parameters, handler

import type { ToolDefinition } from './types';
import { getMCPTools } from '../mcp/mcpManager';

// Import individual tools here
import { calculatorTool } from './calculator';
// import { echoTool } from './__echo';
// import { sayTool } from './say';
import { askQuestionsTool } from './ask-questions';
import { timeTool } from './time';

export const tools: ToolDefinition[] = [
    // echoTool,
    timeTool,
    calculatorTool,
    askQuestionsTool,
    // sayTool
];

export function getAllTools(): ToolDefinition[] {
    return [...tools, ...getMCPTools()]
}

export function getToolByName(name: string): ToolDefinition | undefined {
    return getAllTools().find(tool => tool.name === name)
}
