<script>
    // @ts-nocheck
    import { appState } from "../../appState/appState"
    import {
        chatDelete,
        chatDuplicate,
        chatInProgress,
        chatIsEmpty,
        chatSwitchTo,
    } from "../../lib/chatSession/chatActions"
    import { chats, currentChat } from "../../lib/chatSession/chatSession"
    import BtnNewSession from "./BtnNewSession.svelte"

    // let mobileToggleOpen = $state(false)
    let mobileToggleOpen = false

    function changeConvo(chatId) {
        chatSwitchTo(chatId)
    }

    function deleteConvo(chatId) {
        if (
            chatIsEmpty(chatId) ||
            confirm(
                `Are you sure you want to delete this conversation? ${chatId}`,
            )
        ) {
            chatDelete(chatId)
        }
    }
</script>

<div id="Sidebar">
    <div class="top">
        {#each $chats as chat, i}
            <div
                class="chatRow"
                class:active={chat.id === $appState.activeChatId}
                data-chatid={chat.id}
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

    <div class="bottom">
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
</div>

<style lang="scss">

    #Sidebar {
        display: grid;
        grid-template-rows: 1fr auto;
        height: 100%;
        z-index: 10;
        padding: 1em;

        .top {
            .chatRow {
                display: grid;
                grid-template-columns: auto 24px 24px;
                gap: 0.5em;

                button {
                    border-radius: 8px;

                    &:hover {
                        background-color: var(--color-primary-900) !important;
                        border: unset !important;
                        cursor: pointer;
                    }
                }

                button:first-of-type {
                    padding: 0.5em 1em;
                    background: transparent;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    border: unset !important;
                }

                &.active {
                    button:first-of-type {
                        background-color: var(--color-primary-500);
                        color: black;
                        border-radius: 10px;
                        &:hover {
                            background-color: var(--color-primary-400) !important;
                        }
                    }
                }
            }
        }
        .bottom {
            display: grid;
            grid-template-columns: 1fr auto;
            // padding: 0.5em;
        }
    }
</style>
