<script>
    import { get, writable } from "svelte/store"
    import { appState } from "../../../appState/appState"
    import { chatSetModel } from "../../../chatSession/chatActions"
    import { currentChat } from "../../../chatSession/chatSession"
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

<div class="place-content-center flex flex-row gap-2">
    <select
        bind:value={$selected_model}
        name="system"
        id="system"
        class="flex-auto w-full px-4 variant-ghost-secondary max-w-xs rounded-lg"
    >
        {#each get($llm.models) as { model, name }}
            <option value={model}>{name}</option>
        {/each}
    </select>
    <button class="btn flex-auto">Refresh</button>
</div>
