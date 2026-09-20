<script lang="ts">
    import { tools } from "$lib/tools/index"
    import { appState } from "$lib/appState/appState"

    function isDisabled(name: string): boolean {
        return $appState.disabledTools.includes(name)
    }

    function toggleTool(name: string) {
        appState.update((s) => {
            const disabled = s.disabledTools.includes(name)
                ? s.disabledTools.filter((n) => n !== name)
                : [...s.disabledTools, name]
            return { ...s, disabledTools: disabled }
        })
    }
</script>

<div class="tools-panel">
    <p class="hint">
        Tools the model can use in all chats. Disabled tools are not sent to the model. MCP tools
        are managed in the MCP tab.
    </p>

    <div class="tool-list">
        {#each tools as tool (tool.name)}
            <label
                class="tool-entry"
                class:disabled={isDisabled(tool.name)}
                title={isDisabled(tool.name) ? "Enable" : "Disable"}
            >
                <div class="tool-info">
                    <span class="tool-name">{tool.name}</span>
                    {#if tool.description}
                        <span class="tool-desc">{tool.description}</span>
                    {/if}
                </div>
                <input
                    type="checkbox"
                    checked={!isDisabled(tool.name)}
                    on:change={() => toggleTool(tool.name)}
                />
            </label>
        {/each}
    </div>
</div>

<style>
    .tools-panel {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .hint {
        color: #888;
        font-size: 0.8rem;
        margin: 0;
    }

    .tool-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .tool-entry {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: #111;
        border: 1px solid #444;
        border-radius: var(--border-radius-standard);
        padding: 0.6rem 0.75rem;
        cursor: pointer;

        &.disabled {
            opacity: 0.6;
        }

        &:hover {
            border-color: var(--color-accent);
        }

        input[type="checkbox"] {
            flex-shrink: 0;
            accent-color: var(--color-accent);
        }
    }

    .tool-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .tool-name {
        font-family: monospace;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--color-accent);
    }

    .tool-desc {
        font-size: 0.75rem;
        color: #888;
    }
</style>