<script>
    import { writable } from "svelte/store"
    import llm from "../../../lib/llm/ollama.svelte"
    import { chatSetModel } from "../../../nudes/chatActions"
    import { activeChatId, currentChat } from "../../../nudes/chatSession"

    let selected_model = writable($currentChat.model_name)

    selected_model.subscribe((value) => {
        chatSetModel($activeChatId, value)
    })

    currentChat.subscribe((value) => {
        selected_model.set($currentChat.model_name)
    })
</script>

<div class="place-content-center flex flex-row gap-2">
    <select
        bind:value={$selected_model}
        name="system"
        id="system"
        class="flex-auto w-full px-4 variant-ghost-secondary max-w-xs rounded-lg"
    >
        {#each llm.models as { model, name }}
            <option value={model}>{name}</option>
        {/each}
    </select>
    <button class="btn flex-auto">Refresh</button>
</div>
