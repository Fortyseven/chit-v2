<script>
    import { get, writable } from "svelte/store"
    import { appState } from "../../../lib/appState/appState"
    import { chatSetModel } from "../../../lib/chatSession/chatActions"
    import { currentChat } from "../../../lib/chatSession/chatSession"
    import llm from "../../../lib/llm/ollama"

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
        <select
            bind:value={$selected_model}
            name="system"
            id="system"
        >
            {#each get($llm.models) as { model, name }}
                <option value={model}>{name}</option>
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
        // padding-inline-start: calc(0.25rem /* 4px */ * 4) /* 1rem = 16px */;
        // padding-inline-end: calc(0.25rem /* 4px */ * 7) /* 1.75rem = 28px */;
        max-width: 20rem /* 320px */;
        border: none;
        // border: 1px solid #0000;
        position: relative;
        display: inline-flex;
        flex-shrink: 1;
        // appearance: none;
        align-items: center;
        // gap: 1em;
        // background-color: var(--color-accent-complement);

        // padding-inline-start: 1em;
        // padding-inline-end: 1.75em;
        padding-inline: 1em;

        // vertical-align: middle;
        // width: clamp(3rem, 20rem, 100%);
        font-size: 1em;
        border-radius: var(--border-radius-standard);
        text-overflow: ellipsis;

        option {
            //
        }
    }
</style>
