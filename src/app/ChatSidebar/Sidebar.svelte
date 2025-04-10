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
                    class="chat-title"
                    onclick={() => changeConvo(chat.id)}
                    disabled={$chatInProgress}
                    title={chat.title}
                    aria-label={`Switch to: ${chat.title}`}
                >
                    {chat.title}
                </button>
                <button
                    class="duplicate"
                    onclick={() => {
                        chatDuplicate(chat.id)
                    }}
                    disabled={$chatInProgress}
                    title="Duplicate"
                    aria-label={`Duplicate: ${chat.title}`}
                >
                    D
                </button>
                <button
                    class="delete"
                    onclick={() => deleteConvo(chat.id)}
                    disabled={$chatInProgress}
                    title="Delete"
                    aria-label={`Delete: ${chat.title}`}
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
            <button disabled={$chatInProgress}> Config </button>
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

        background-color: var(--color-background);
        color: var(--color-text);

        .top {
            .chatRow {
                display: grid;
                grid-template-columns: auto 24px 24px;
                gap: 0.25em;

                button {
                    padding: 0;
                    margin-bottom: 0.5em;
                    line-height: 1;
                }

                button.chat-title {
                    color: var(--color-text);
                    background: transparent;
                    padding: 0.5em 1em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-align: left;
                    &:hover {
                        color: var(--color-accent);
                    }
                }

                button.duplicate,
                button.delete {
                    color: var(--color-accent-complement);
                    &:hover {
                        color: white;
                        background-color: var(--color-accent-complement-darker);
                    }
                    background: transparent;
                }

                &.active {
                    button:first-of-type {
                        background-color: var(--color-accent);
                        color: black;
                        border-radius: 10px;
                        &:hover {
                            background-color: var(--color-accent-lighter);
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
