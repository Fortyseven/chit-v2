<script>
    import { get, writable } from "svelte/store"
    import { appState } from "../../../lib/appState/appState"
    import { chatSetModel } from "../../../lib/chatSession/chatActions"
    import { currentChat } from "../../../lib/chatSession/chatSession"
    import llm, { llmModels } from "../../../lib/llm/llm"

    let selected_model = writable($currentChat.model_name)

    selected_model.subscribe((value) => {
        chatSetModel($appState.activeChatId, value)
    })

    currentChat.subscribe((value) => {
        if ($currentChat) {
            selected_model.set($currentChat.model_name)
        }
    })
</script>

<div class="model-select">
    {#key selected_model}
        <select bind:value={$selected_model} name="system" id="system">
            {#each $llmModels as m}
                {#if typeof m === "string"}
                    <option value={m}>{m}</option>
                {:else}
                    <option value={m.name || m.model}
                        >{m.name || m.model}</option
                    >
                {/if}
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
        max-width: 20rem /* 320px */;
        border: none;
        position: relative;
        display: inline-flex;
        flex-shrink: 1;
        // appearance: none;
        align-items: center;
        background-color: var(--color-accent-complement-darker2);
        color: var(--color-text);
        padding-inline: 1em;
        font-size: 1em;
        border-radius: var(--border-radius-standard);
        text-overflow: ellipsis;

        option {
            background-color: red;
            color: white;
        }
    }
</style>
