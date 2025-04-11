<script>
    import { chatNew } from "../../lib/chatSession/chatActions"
    import { currentChat } from "../../lib/chatSession/chatSession"
    import SYSTEM_PROMPTS from "../../preset-prompts/index.js"

    export let open = false

    function selectPrompt(prompt_def) {
        chatNew()
        console.log($currentChat.system_prompt)
        $currentChat.system_prompt = prompt_def.prompt
        // debugger;
    }
</script>

<div class="system-presets-popup" class:open={open}>
    {#each Object.keys(SYSTEM_PROMPTS) as skey}
        {@const p = SYSTEM_PROMPTS[skey]}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_missing_attribute -->
        <button
            type="button"
            class="btn-preset"
            onclick={selectPrompt(p)}
        >
            {p.name}
        </button>
    {/each}
</div>

<style lang="scss">
.system-presets-popup {
    flex-direction: column;
    padding: 0.5em 0.5em;
    background-color: var(--color-background-lighter);
    box-shadow: 0 0 10px black;
    display: none;
    border-radius: 1em;

    &.open {
        display: flex;
    }

    button.btn-preset {
        background-color: transparent;
        color: var(--color-accent);
        text-align: left;

        &:hover {
            background-color: var(--color-accent);
            color: var(--color-accent-text);
        }
    }
}
</style>
