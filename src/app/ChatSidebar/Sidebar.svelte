<script>
    // @ts-nocheck

    import { AppRail, AppRailTile } from "@skeletonlabs/skeleton"

    import { appState } from "../../appState/appState"
    import {
        chatDelete,
        chatDuplicate,
        chatInProgress,
        chatIsEmpty,
        chatSwitchTo,
    } from "../../chatSession/chatActions"
    import { chats, currentChat } from "../../chatSession/chatSession"
    import BtnNewSession from "./BtnNewSession.svelte"

    // let mobileToggleOpen = $state(false)
    let mobileToggleOpen = false

    function changeConvo(chatId) {
        chatSwitchTo(chatId)
    }

    function deleteConvo(chatId) {
        if (
            chatIsEmpty(chatId) ||
            confirm("Are you sure you want to delete this conversation?")
        ) {
            chatDelete(chatId)
        }
    }
</script>

<AppRail class="convo-panel app-rail h-full w-full p-4 hidden sm:grid">
    <svelte:fragment slot="lead">
        <div class="flex flex-col w-full gap-2 shadow-lg">
            {#each $chats as chat, i}
                <div
                    class="grid grid-cols-[auto_24px_24px] flex-row"
                    class:active={chat.id === $appState.activeChatId}
                >
                    <button
                        class="text-left disabled:opacity-50"
                        onclick={() => changeConvo(chat.id)}
                        disabled={$chatInProgress}
                        title={chat.title}
                    >
                        {chat.title}
                    </button>
                    <button
                        class="opacity-75 p-0 w-8 disabled:opacity-50"
                        onclick={() => {
                            chatDuplicate(chat.id)
                        }}
                        disabled={$chatInProgress}
                    >
                        🗋
                    </button>
                    <button
                        class="p-0 w-8 disabled:opacity-50"
                        onclick={() => deleteConvo(chat.id)}
                        disabled={$chatInProgress}
                    >
                        🗑
                    </button>
                </div>
            {/each}
        </div>
    </svelte:fragment>

    <svelte:fragment slot="trail">
        <div class="flex gap-2">
            <div>
                <BtnNewSession></BtnNewSession>
            </div>
            <div>
                <button
                    class="btn variant-filled-secondary !rounded-lg disabled:opacity-50"
                    disabled={$chatInProgress}
                >
                    Config
                </button>
            </div>
        </div>
    </svelte:fragment>
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
            background-color: rgb(var(--color-surface-600));

            border: unset !important;
        }
    }

    .active {
        // outline: 2px solid rgb(var(--color-primary-500));
        button:first-of-type {
            background-color: rgb(var(--color-primary-500));
            color: black;
            border-radius: 10px;
        }
    }
</style>
