<script lang="ts">
    import { appState } from "$lib/appState/appState"
    import { chatSetModel } from "$lib/chatSession/chatActions"
    import { currentChat } from "$lib/chatSession/chatSession"
    import { llm, llmModels } from "$lib/llm/llm"
    import { get } from "svelte/store"

    let selected_model: string = $currentChat?.model_name ?? ""

    // Sync from chat to local selection
    $: if ($currentChat) {
        selected_model = $currentChat.model_name
    }

    /**
     * Get the display name of a model entry (string or object).
     * @param m - A model entry from the llmModels store
     * @returns The model's display name
     */
    function modelLabel(m: any): string {
        return typeof m === "string" ? m : m.name || m.model
    }

    /**
     * Models grouped by everything before the final "/" in their name,
     * e.g. "x/qwen38/27b-default" is grouped under "x/qwen38".
     * Models without a "/" are kept in `ungrouped`.
     */
    $: modelGroups = (() => {
        const groups = new Map<string, string[]>()
        const ungrouped: string[] = []
        for (const m of $llmModels) {
            const name = modelLabel(m)
            const slash = name.lastIndexOf("/")
            if (slash === -1) {
                ungrouped.push(name)
                continue
            }
            const prefix = name.slice(0, slash)
            const existing = groups.get(prefix)
            if (existing) {
                existing.push(name)
            } else {
                groups.set(prefix, [name])
            }
        }
        return { groups: [...groups.entries()], ungrouped }
    })()

    function onModelChange() {
        chatSetModel($appState.activeChatId, selected_model)
        // First access to this model: sync the context window, if reported
        get(llm).applyModelContext($appState.activeChatId, selected_model)
    }
</script>

<div class="model-select">
    {#key selected_model}
        <select
            bind:value={selected_model}
            on:change={onModelChange}
            name="system"
            id="system"
        >
            {#each modelGroups.ungrouped as name}
                <option value={name}>{name}</option>
            {/each}
            {#each modelGroups.groups as [prefix, names]}
                <optgroup label={prefix}>
                    {#each names as name}
                        <option value={name}>{name}</option>
                    {/each}
                </optgroup>
            {/each}
        </select>
    {/key}
</div>

<style lang="scss">
    .model-select {
        // place-content: center;
        // display: flex;
        // flex-direction: row;
        // gap: 2rem;
    }

    select {
        flex: auto;
        width: 100%;
        height: 100%;
        background-color: var(--color-accent-complement-darkest-extreme);
        max-width: 20rem /* 320px */;
        border: none;
        position: relative;
        display: inline-flex;
        flex-shrink: 1;
        align-items: center;
        background-color: var(--color-accent-complement-darkest);
        color: white;
        padding-inline: 1em;
        font-size: 1em;
        border-radius: var(--border-radius-standard);
        font-family: var(--font-ui);
        text-overflow: ellipsis;
        cursor: pointer;
        transition: background-color 0.15s ease;

        &:hover {
            background-color: var(--color-accent-complement-darker);
        }

        option {
            background-color: var(--color-accent-complement-darkest);
            padding: 0.5em;
            font-size: 0.8em;
        }
    }
</style>
