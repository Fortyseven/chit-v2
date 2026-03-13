<script lang="ts">
    import { onMount } from "svelte"
    export let toolName: string
    export let params: string
    export let result: string
    export let error: string | null = null
    export let expanded: boolean = false
    export let onToggle: () => void
</script>

<div class="tool-call-message">
    <div
        class="summary"
        on:click={onToggle}
        on:keydown={(e) => e.key === "Enter" && onToggle()}
        role="button"
        tabindex="0"
    >
        [calling tool <span class="tool-name">*{toolName}*</span>]
        {#if error}
            <span class="error">(error)</span>
        {/if}
    </div>
    {#if expanded}
        <div class="details">
            <div><b>Params:</b> {params}</div>
            {#if result}
                <div><b>Result:</b> {result}</div>
            {/if}
            {#if error}
                <div class="error"><b>Error:</b> {error}</div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .tool-call-message {
        margin: 0.5rem 0;
        background: #222;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        font-family: monospace;
        cursor: pointer;
    }
    .summary {
        color: var(--color-accent);
        font-weight: bold;
    }
    .tool-name {
        color: var(--color-accent-lighter);
    }
    .details {
        margin-top: 0.5rem;
        background: #333;
        border-radius: 4px;
        padding: 0.5rem;
    }
    .error {
        color: #ff5555;
        font-weight: bold;
    }
</style>
