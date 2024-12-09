<script>
    // @ts-nocheck

    import { AppRail, AppRailTile } from "@skeletonlabs/skeleton"

    import { fly, slide } from "svelte/transition"
    import { currentConvoIndex } from "../../stores/appState.svelte.js"
    import { convos } from "../../stores/chatState.svelte.js"

    let mobileToggleOpen = $state(false)

    function changeConvo(convoIndex) {
        $currentConvoIndex = convoIndex
    }

    function deleteConvo(convoIndex) {
        if (confirm("Are you sure you want to delete this conversation?")) {
            // so we don't try to render a convo that soon won't exist
            if (convoIndex === $currentConvoIndex) {
                $currentConvoIndex = 0
            }

            convos.rm(convoIndex)
        }
    }
</script>

<AppRail class="convo-panel app-rail h-full w-full p-4 hidden sm:grid">
    {#snippet lead()}
        <div
            class="flex flex-col gap-2 shadow-lg"
            in:fly={{ x: 200, duration: 2000 }}
        >
            {#each $convos.entries as conversation, i}
                <div class="flex flex-row justify-between">
                    <button
                        type="button"
                        class="btn variant-filled-surface flex-auto"
                        onclick={() => changeConvo(i)}
                    >
                        {conversation.title}
                    </button>
                    <button
                        type="button"
                        class=" variant-filled-surface text-primary-500-400-token
                                opacity-75 p-0 w-8"
                        onclick={() => deleteConvo(i)}
                    >
                        X
                    </button>
                </div>
            {/each}
        </div>
    {/snippet}

    {#snippet trail()}
        <div class="flex flex-row justify-between">
            <button type="button" class="btn variant-filled-primary flex-none">
                *
            </button>
            <button type="button" class="btn variant-filled-primary flex-auto">
                New Conversation +
            </button>
        </div>
    {/snippet}
</AppRail>

<style lang="scss">
    :global(.convo-panel.app-rail) {
        background-color: rgb(var(--color-surface-800));
    }

    button {
        border-radius: 8px;
        background: transparent;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
