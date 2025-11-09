<script lang="ts">
    import { chatSetCurrentMode } from "../../../../lib/chatSession/chatActions"
    import {
        AppMode,
        currentChatMode,
    } from "../../../../lib/chatSession/chatSession"

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
</script>

<div class="mode-selector">
    <label for="mode-select">Mode:</label>
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
            background-color: var(--color-surface-700);
            color: var(--color-accent);
            border: 1px solid var(--color-accent-complement-darker);
            border-radius: 4px;
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
