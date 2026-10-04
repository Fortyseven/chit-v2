// Tool registry: aggregates all tool modules
// Each tool exports: name, description, parameters, handler

import { get } from 'svelte/store';
import { appState } from '../appState/appState';
import { getMCPTools } from '../mcp/mcpManager';
import type { ToolDefinition } from './types';

// Import individual tools here
import { calculatorTool } from './calculator';
// import { echoTool } from './__echo';
// import { sayTool } from './say';
import { askQuestionsTool } from './ask-questions';
import { drawOverlayTool } from './draw-overlay';
import { generateImageTool } from './generate-image';
import { timeTool } from './time';

export const tools: ToolDefinition[] = [
    // echoTool,
    timeTool,
    calculatorTool,
    askQuestionsTool,
    generateImageTool,
    drawOverlayTool,
    // sayTool
];

/**
 * Whether a tool is enabled by the user in the config panel.
 * Tools are enabled by default; disabling is opt-in via appState.
 */
export function isToolEnabled(name: string): boolean {
    return !get(appState).disabledTools.includes(name)
}

export function getAllTools(): ToolDefinition[] {
    const enabledBuiltIns = tools.filter(tool => isToolEnabled(tool.name))
    return [...enabledBuiltIns, ...getMCPTools()]
}

export function getToolByName(name: string): ToolDefinition | undefined {
    return getAllTools().find(tool => tool.name === name)
}
