<script>
    import { chatNew } from "../../lib/chatSession/chatActions"
    import { currentChat } from "../../lib/chatSession/chatSession"
    import SYSTEM_PROMPTS from "../../preset-prompts/index.js"

    function selectPrompt(prompt_def) {
        chatNew()
        console.log($currentChat.system_prompt)
        $currentChat.system_prompt = prompt_def.prompt
        // debugger;
    }
</script>

<div class="system-presets-popup">
    {#each Object.keys(SYSTEM_PROMPTS) as skey}
        {@const p = SYSTEM_PROMPTS[skey]}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_missing_attribute -->
        <button
            type="button"
            class="cursor-pointer text-start text-primary-500 p-0 hover:bg-primary-800 outline-hidden"
            onclick={selectPrompt(p)}
        >
            {p.name}
        </button>
    {/each}
</div>

<style lang="scss">
.system-presets-popup {
    display: flex;
    flex-direction: column;
    // gap: 0.5rem;
    padding: 1rem;
    background-color: var(--bg-color);
    border-radius: 0.5rem;
    box-shadow: var(--shadow);

    button {
        border-radius: 0.5rem;
        background-color: #f0f;
        color: var(--text-color);
        font-size: 1rem;
        text-align: left;
        transition: background-color 0.2s ease;

        &:hover {
            background-color: var(--bg-hover);
        }
    }
}
</style>
