import { get, writable } from 'svelte/store'
import { Client } from '@modelcontextprotocol/sdk/client'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse'
import type { ToolDefinition } from '../tools/types'
import type { MCPServerConfig } from './types'

export type MCPConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error'

export interface MCPServerState {
    config: MCPServerConfig
    status: MCPConnectionStatus
    error?: string
    tools: ToolDefinition[]
    client?: Client
}

export const mcpServersStore = writable<MCPServerState[]>([])

function wrapMCPTool(toolDef: any, client: Client, serverName: string): ToolDefinition {
    return {
        name: toolDef.name,
        description: toolDef.description || '',
        parameters: toolDef.inputSchema?.properties || {},
        async handler(params) {
            const result = await client.callTool({ name: toolDef.name, arguments: params })
            const content = result.content as any[]
            if (!content || content.length === 0) return ''
            const textBlocks = content.filter((b: any) => b.type === 'text')
            if (textBlocks.length === 1) return textBlocks[0].text
            if (textBlocks.length > 1) return textBlocks.map((b: any) => b.text).join('\n')
            return JSON.stringify(content)
        }
    }
}

export async function connectServer(config: MCPServerConfig): Promise<void> {
    mcpServersStore.update(servers => {
        const idx = servers.findIndex(s => s.config.id === config.id)
        const entry: MCPServerState = { config, status: 'connecting', tools: [] }
        if (idx >= 0) { servers[idx] = entry } else { servers.push(entry) }
        return [...servers]
    })

    const client = new Client({ name: 'chit', version: '1.0.0' })
    let connected = false

    // Try Streamable HTTP first, fall back to SSE
    try {
        const headers: Record<string, string> = {}
        if (config.authToken) headers['Authorization'] = `Bearer ${config.authToken}`
        const transport = new StreamableHTTPClientTransport(new URL(config.url), { requestInit: { headers } })
        await client.connect(transport)
        connected = true
    } catch {
        try {
            const headers: Record<string, string> = {}
            if (config.authToken) headers['Authorization'] = `Bearer ${config.authToken}`
            const transport = new SSEClientTransport(new URL(config.url), { eventSourceInit: {}, requestInit: { headers } })
            await client.connect(transport)
            connected = true
        } catch (err2) {
            const msg = err2 instanceof Error ? err2.message : String(err2)
            mcpServersStore.update(servers => {
                const idx = servers.findIndex(s => s.config.id === config.id)
                if (idx >= 0) servers[idx] = { config, status: 'error', error: msg, tools: [] }
                return [...servers]
            })
            return
        }
    }

    if (!connected) return

    try {
        const { tools: mcpTools } = await client.listTools()
        const wrappedTools = mcpTools.map(t => wrapMCPTool(t, client, config.name))
        mcpServersStore.update(servers => {
            const idx = servers.findIndex(s => s.config.id === config.id)
            if (idx >= 0) servers[idx] = { config, status: 'connected', tools: wrappedTools, client }
            return [...servers]
        })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        mcpServersStore.update(servers => {
            const idx = servers.findIndex(s => s.config.id === config.id)
            if (idx >= 0) servers[idx] = { config, status: 'error', error: msg, tools: [], client }
            return [...servers]
        })
    }
}

export async function disconnectServer(id: string): Promise<void> {
    const servers = get(mcpServersStore)
    const entry = servers.find(s => s.config.id === id)
    if (entry?.client) {
        try { await entry.client.close() } catch { }
    }
    mcpServersStore.update(servers => {
        const idx = servers.findIndex(s => s.config.id === id)
        if (idx >= 0) servers[idx] = { ...servers[idx], status: 'idle', tools: [], client: undefined }
        return [...servers]
    })
}

export function getMCPTools(): ToolDefinition[] {
    return get(mcpServersStore)
        .filter(s => s.status === 'connected' && s.config.enabled)
        .flatMap(s => s.tools)
}

export async function initMCPServers(configs: MCPServerConfig[]): Promise<void> {
    // Reset store to just the configs (idle state), then connect enabled ones
    mcpServersStore.set(configs.map(c => ({ config: c, status: 'idle', tools: [] })))
    await Promise.all(configs.filter(c => c.enabled).map(c => connectServer(c)))
}
