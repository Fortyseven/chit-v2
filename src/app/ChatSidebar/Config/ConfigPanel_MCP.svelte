<script lang="ts">
    import { appState } from "$lib/appState/appState"
    import {
        connectServer,
        disconnectServer,
        mcpServersStore,
    } from "$lib/mcp/mcpManager"
    import type { MCPServerConfig } from "$lib/mcp/types"

    let newName = ""
    let newUrl = ""
    let newToken = ""
    let expandedId: string | null = null

    function generateId(): string {
        return crypto.randomUUID()
    }

    async function addServer() {
        if (!newName.trim() || !newUrl.trim()) return
        const config: MCPServerConfig = {
            id: generateId(),
            name: newName.trim(),
            url: newUrl.trim(),
            authToken: newToken.trim() || undefined,
            enabled: true,
        }
        appState.update((s) => ({ ...s, mcpServers: [...s.mcpServers, config] }))
        newName = ""
        newUrl = ""
        newToken = ""
        await connectServer(config)
    }

    async function removeServer(id: string) {
        await disconnectServer(id)
        appState.update((s) => ({
            ...s,
            mcpServers: s.mcpServers.filter((c) => c.id !== id),
        }))
        mcpServersStore.update((servers) => servers.filter((s) => s.config.id !== id))
    }

    async function toggleEnabled(config: MCPServerConfig) {
        const updated = { ...config, enabled: !config.enabled }
        appState.update((s) => ({
            ...s,
            mcpServers: s.mcpServers.map((c) => (c.id === config.id ? updated : c)),
        }))
        if (updated.enabled) {
            await connectServer(updated)
        } else {
            await disconnectServer(updated.id)
        }
    }

    function statusColor(status: string): string {
        if (status === "connected") return "var(--color-accent)"
        if (status === "connecting") return "#f0a500"
        if (status === "error") return "#e05555"
        return "#666"
    }
</script>

<div class="mcp-panel">
    <div class="server-list">
        {#if $mcpServersStore.length === 0}
            <p class="empty">No MCP servers configured.</p>
        {:else}
            {#each $mcpServersStore as entry (entry.config.id)}
                <div class="server-entry" class:disabled={!entry.config.enabled}>
                    <div class="server-row">
                        <div class="server-info">
                            <span class="server-name">{entry.config.name}</span>
                            <span class="server-url">{entry.config.url}</span>
                        </div>
                        <div class="server-meta">
                            <span
                                class="status-badge"
                                style="color: {statusColor(entry.status)}"
                                title={entry.error ?? entry.status}
                            >
                                {entry.status}
                            </span>
                            {#if entry.status === "connected"}
                                <span class="tool-count">{entry.tools.length} tools</span>
                            {/if}
                        </div>
                        <div class="server-actions">
                            <button
                                class="toggle-btn"
                                class:active={entry.config.enabled}
                                on:click={() => toggleEnabled(entry.config)}
                                title={entry.config.enabled ? "Disable" : "Enable"}
                            >
                                {entry.config.enabled ? "On" : "Off"}
                            </button>
                            {#if entry.tools.length > 0}
                                <button
                                    class="expand-btn"
                                    on:click={() =>
                                        (expandedId =
                                            expandedId === entry.config.id
                                                ? null
                                                : entry.config.id)}
                                    title="Show tools"
                                >
                                    {expandedId === entry.config.id ? "▲" : "▼"}
                                </button>
                            {/if}
                            <button
                                class="remove-btn"
                                on:click={() => removeServer(entry.config.id)}
                                title="Remove server"
                            >✕</button>
                        </div>
                    </div>
                    {#if expandedId === entry.config.id && entry.tools.length > 0}
                        <div class="tool-list">
                            {#each entry.tools as tool}
                                <div class="tool-item">
                                    <span class="tool-name">{tool.name}</span>
                                    {#if tool.description}
                                        <span class="tool-desc">{tool.description}</span>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>

    <div class="add-server">
        <div class="add-title">Add MCP Server</div>
        <div class="form-group row">
            <div class="field">
                <label for="mcp-name">
                    Name
                    <input
                        id="mcp-name"
                        type="text"
                        placeholder="My MCP Server"
                        bind:value={newName}
                    />
                </label>
            </div>
            <div class="field">
                <label for="mcp-url">
                    URL
                    <input
                        id="mcp-url"
                        type="text"
                        placeholder="http://localhost:3000/mcp"
                        bind:value={newUrl}
                    />
                </label>
            </div>
        </div>
        <div class="form-group">
            <div class="field">
                <label for="mcp-token">
                    Auth Token (optional)
                    <input
                        id="mcp-token"
                        type="password"
                        placeholder="Bearer token"
                        bind:value={newToken}
                    />
                </label>
            </div>
        </div>
        <button class="add-btn" on:click={addServer} disabled={!newName.trim() || !newUrl.trim()}>
            Add Server
        </button>
    </div>
</div>

<style>
    .mcp-panel {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .empty {
        color: #666;
        font-style: italic;
        margin: 0;
    }

    .server-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .server-entry {
        background: #111;
        border: 1px solid #444;
        border-radius: var(--border-radius-standard);
        overflow: hidden;

        &.disabled {
            opacity: 0.6;
        }
    }

    .server-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 0.75rem;
    }

    .server-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .server-name {
        color: var(--color-accent);
        font-weight: 600;
        font-size: 0.9rem;
    }

    .server-url {
        color: #888;
        font-size: 0.75rem;
        font-family: monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .server-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.1rem;
        flex-shrink: 0;
    }

    .status-badge {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    .tool-count {
        font-size: 0.7rem;
        color: #888;
    }

    .server-actions {
        display: flex;
        gap: 0.35rem;
        flex-shrink: 0;

        button {
            background: #1a1a1a;
            border: 1px solid #555;
            color: var(--color-accent);
            padding: 0.25rem 0.5rem;
            border-radius: var(--border-radius-standard);
            cursor: pointer;
            font-size: 0.8rem;
            font-family: monospace;

            &:hover {
                border-color: var(--color-accent);
            }
        }

        .toggle-btn.active {
            border-color: var(--color-accent);
            background: var(--color-background-lighter);
        }

        .remove-btn {
            color: #e05555;
            border-color: #553333;

            &:hover {
                border-color: #e05555;
            }
        }
    }

    .tool-list {
        border-top: 1px solid #333;
        padding: 0.5rem 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .tool-item {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
    }

    .tool-name {
        font-family: monospace;
        font-size: 0.8rem;
        color: var(--color-accent);
    }

    .tool-desc {
        font-size: 0.75rem;
        color: #888;
    }

    .add-server {
        border-top: 1px solid #333;
        padding-top: 1rem;
    }

    .add-title {
        font-weight: 600;
        color: var(--color-accent-lighter);
        margin-bottom: 0.75rem;
    }

    .form-group {
        * {
            box-sizing: border-box !important;
        }

        margin-bottom: 0.75rem;
        display: flex;
        gap: 1rem;

        > div {
            flex: 1;
        }

        &.row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 0.5rem;
        }

        .field {
            label {
                display: block;
                font-weight: 500;
                color: var(--color-accent-lighter);
                font-size: 0.9rem;

                input {
                    margin-top: 0.25rem;
                }

                input[type="text"],
                input[type="password"] {
                    width: 100%;
                    padding: 0.5rem;
                    border-radius: var(--border-radius-standard);
                    border: 1px solid #555;
                    background-color: #111;
                    color: var(--color-accent);
                    font-family: monospace;
                }
            }
        }
    }

    .add-btn {
        background: var(--color-background-lighter);
        border: 1px solid var(--color-accent);
        color: var(--color-accent);
        padding: 0.5rem 1.25rem;
        border-radius: var(--border-radius-standard);
        cursor: pointer;
        font-weight: 600;

        &:disabled {
            opacity: 0.4;
            cursor: default;
            border-color: #555;
            color: #666;
        }

        &:not(:disabled):hover {
            background: #222;
        }
    }
</style>
