// Tool registry: aggregates all tool modules
// Each tool exports: name, description, parameters, handler

import { get } from 'svelte/store';
import { appState } from '../appState/appState';
import { chatFind } from '../chatSession/chatActions';
import { getMCPTools } from '../mcp/mcpManager';
import { rpTrackingActive } from '../rp/state';
import type { ToolDefinition } from './types';

// Import individual tools here
import { calculatorTool } from './calculator';
// import { echoTool } from './__echo'; -- example
import { askQuestionsTool } from './ask-questions';
import { drawOverlayTool } from './draw-overlay';
import { generateImageTool } from './generate-image';
import { timeTool } from './time';

// RP story tracking tools (only offered while tracking is active for the
// chat; their handlers also self-guard).
import { rpStartScenarioTool } from '../rp/tools/rpStartScenario';
import { rpGetStateTool } from '../rp/tools/rpGetState';
import { rpUpdateStateTool } from '../rp/tools/rpUpdateState';

const RP_TRACKING_TOOL_NAMES = new Set([
    rpStartScenarioTool.name,
    rpGetStateTool.name,
    rpUpdateStateTool.name,
]);

export const tools: ToolDefinition[] = [
    // echoTool,
    timeTool,
    calculatorTool,
    askQuestionsTool,
    generateImageTool,
    drawOverlayTool,
    rpStartScenarioTool,
    rpGetStateTool,
    rpUpdateStateTool,
    // sayTool
];

/**
 * Whether a tool is enabled by the user in the config panel.
 * Tools are enabled by default; disabling is opt-in via appState.
 */
export function isToolEnabled(name: string): boolean {
    return !get(appState).disabledTools.includes(name)
}

/**
 * All enabled tools. When a chatId is provided, RP tracking tools are
 * only included if tracking is active for that chat (RP mode + tools +
 * per-chat toggle). Without a chatId (e.g. dispatch lookups) they are
 * always included so handlers can self-guard with a clear error.
 */
export function getAllTools(chatId?: string): ToolDefinition[] {
    const chat = chatId ? chatFind(chatId) : undefined
    const enabledBuiltIns = tools.filter(tool => {
        if (!isToolEnabled(tool.name)) return false
        if (
            chat &&
            RP_TRACKING_TOOL_NAMES.has(tool.name) &&
            !rpTrackingActive(chat)
        ) {
            return false
        }
        return true
    })
    return [...enabledBuiltIns, ...getMCPTools()]
}

export function getToolByName(name: string): ToolDefinition | undefined {
    return getAllTools().find(tool => tool.name === name)
}
