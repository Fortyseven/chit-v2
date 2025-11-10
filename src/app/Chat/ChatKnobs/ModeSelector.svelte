<script lang="ts">
    import { chatSetCurrentMode } from "../../../lib/chatSession/chatActions"
    import {
        AppMode,
        currentChatMode,
    } from "../../../lib/chatSession/chatSession"

    function handleModeChange(event: Event) {
        const target = event.target as HTMLSelectElement
        const selectedMode = target.value as AppMode
        chatSetCurrentMode(selectedMode)
    }

    function getModeDisplayName(mode: AppMode): string {
        switch (mode) {
            case AppMode.DEFAULT:
                return "Default"
            case AppMode.RP:
                return "RP"
            default:
                return mode
        }
    }

    // Keyboard handler for CTRL+1, CTRL+2, etc.
    function handleKeydown(event: KeyboardEvent) {
        if (!event.ctrlKey) return
        // Only handle number keys 1-9
        const num = parseInt(event.key)
        if (isNaN(num) || num < 1) return
        const modes = Object.values(AppMode)
        if (num > modes.length) return
        const selectedMode = modes[num - 1]
        chatSetCurrentMode(selectedMode)
        event.preventDefault()
    }

    import { onDestroy, onMount } from "svelte"
    onMount(() => {
        window.addEventListener("keydown", handleKeydown)
    })
    onDestroy(() => {
        window.removeEventListener("keydown", handleKeydown)
    })
</script>

<div class="mode-selector">
    <select
        id="mode-select"
        value={$currentChatMode}
        on:change={handleModeChange}
    >
        {#each Object.values(AppMode) as mode}
            <option value={mode}>
                {getModeDisplayName(mode)}
            </option>
        {/each}
    </select>
</div>

<style lang="scss">
    .mode-selector {
        display: flex;
        align-items: center;
        gap: 0.5em;
        font-size: 0.8rem;
        color: var(--color-accent);

        label {
            color: var(--color-accent-complement-lighter);
            font-weight: 500;
        }

        select {
            background-color: var(--color-accent-darker);
            color: black;
            border: none;
            height: 100%;
            border-radius: var(--border-radius-standard);
            padding: 0.25em 0.5em;
            font-size: 0.8rem;
            outline: none;
            cursor: pointer;

            &:hover {
                border-color: var(--color-accent);
            }

            &:focus {
                border-color: var(--color-accent);
                box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb), 0.2);
            }

            option {
                background-color: var(--color-surface-700);
                color: var(--color-text);
            }
        }
    }
</style>
