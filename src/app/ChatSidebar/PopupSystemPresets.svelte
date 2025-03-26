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

<div class="shadow-2xl !p-4 z-20 bg-neutral-800 flex flex-col">
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
</style>
