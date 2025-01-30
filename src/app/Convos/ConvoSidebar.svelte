<script>
    // @ts-nocheck

    import { AppRail, AppRailTile } from "@skeletonlabs/skeleton"

    import {
        chatSessionCreate,
        chatSessionDelete,
        chatSessions,
        currentChatSession,
        currentChatSessionIndex,
    } from "../../stores/chatSessions.svelte.js"

    import BtnNewSession from "./BtnNewSession.svelte"

    let mobileToggleOpen = $state(false)
    console.log($chatSessions)

    function changeConvo(convoIndex) {
        $currentChatSessionIndex = convoIndex
    }

    function deleteConvo(convoIndex) {
        if (confirm("Are you sure you want to delete this conversation?")) {
            // so we don't try to render a convo that soon won't exist
            if (convoIndex === $currentChatSessionIndex) {
                $currentChatSessionIndex = 0
            }

            chatSessionDelete(convoIndex)
        }
    }
</script>

<AppRail class="convo-panel app-rail h-full w-full p-4 hidden sm:grid">
    {#snippet lead()}
        <div class="flex flex-col gap-2 shadow-lg">
            {#each $chatSessions.sessions as conversation, i}
                <div
                    class="flex flex-row justify-between"
                    class:active={i === $currentChatSessionIndex}
                >
                    <button class=" flex-auto" onclick={() => changeConvo(i)}>
                        {conversation.title}
                    </button>
                    <button class="opacity-75 p-0 w-8" onclick={() => {}}>
                        D
                    </button>
                    <button class="p-0 w-8" onclick={() => deleteConvo(i)}>
                        X
                    </button>
                </div>
            {/each}
        </div>
    {/snippet}

    {#snippet trail()}
        <div class="flex gap-2">
            <div>
                <BtnNewSession></BtnNewSession>
            </div>
            <div>
                <button class="btn variant-filled-secondary !rounded-lg">
                    Config
                </button>
            </div>
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
        border: unset !important;
        background-color: rgb(var(--color-surface-700));
        &:hover {
            background-color: rgb(var(--color-surface-500));
            border: unset !important;
        }
    }

    .active {
        border: 2px solid rgb(var(--color-primary-500));
    }
</style>
