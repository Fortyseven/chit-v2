<script>
    // @ts-nocheck

    import SYSTEM_PROMPTS from "../../preset-prompts/index.js"
    import {
        chatSessions,
        currentChatSession,
    } from "../../stores/chatState.svelte.js"

    function selectPrompt(prompt_def) {
        $currentChatSession.chatState.system_prompt = prompt_def.prompt
    }
</script>

<div
    class="card shadow-2xl !p-4 !bg-neutral-700 text-primary-500 z-20 flex flex-col"
>
    {#each Object.keys(SYSTEM_PROMPTS) as skey}
        {@const p = SYSTEM_PROMPTS[skey]}
        <button
            type="button"
            class="btn !text-left !justify-start"
            onclick={selectPrompt(p)}
        >
            {p.name}
        </button>
    {/each}
</div>

<style lang="scss">
</style>
