<script lang="ts">
    import { afterUpdate } from "svelte"
    import { appState } from "../../../../lib/appState/appState"
    import {
        chatGetStreamingPending,
        chatInProgressWithId,
    } from "../../../../lib/chatSession/chatActions"
    import { ChatMediaType } from "../../../../lib/chatSession/chatAttachments"
    import { currentChat } from "../../../../lib/chatSession/chatSession"
    import { memoizeBlobUrl } from "../../../../lib/memoizeBlob"
    import ChatLogRegular_Assistant from "./ChatLogRegular_Assistant.svelte"
    import ChatLogRegular_User from "./ChatLogRegular_User.svelte"

    function isObjectEmpty(obj: any) {
        return Object.keys(obj).length === 0
    }
</script>

<div class="wrapper" id="ChatLogRegular">
    {#if $appState.activeChatId && $currentChat?.messages}
        {#each $currentChat.messages as message, i}
            {#key message}
                {#if message.role === "user"}
                    {#if message.media && message.media.length > 0}
                        {#each message.media as media}
                            {#if media.type === ChatMediaType.IMAGE}
                                <div class="media-attachment">
                                    <img
                                        src={memoizeBlobUrl(media?.data)}
                                        alt="Media Attachment"
                                        class="max-h-48 m-auto"
                                    />
                                </div>
                            {/if}
                        {/each}
                    {/if}
                    {#if message.content}
                        <ChatLogRegular_User line={message.content}
                        ></ChatLogRegular_User>
                    {/if}
                {:else if message.role === "user" && !message.content}
                    <!-- cont'd -->
                {:else}
                    <ChatLogRegular_Assistant line={message.content}
                    ></ChatLogRegular_Assistant>
                {/if}
            {/key}
        {/each}

        {#key $currentChat}
            {#if chatInProgressWithId($appState.activeChatId)}
                <ChatLogRegular_Assistant
                    line={chatGetStreamingPending()}
                    inprogress
                ></ChatLogRegular_Assistant>
            {/if}
        {/key}
    {/if}
</div>

<style lang="scss">
    #ChatLogRegular {
        width: stretch;
        flex-direction: column;
        overflow-y: auto;
        overflow-x: scroll;
        max-width: var(--timeline-max-width);
        margin-inline: auto;
        font-size: 1.25em;
        margin-block: 5rem 12rem;
        padding-inline: 1em;

        .media-attachment {
            margin-block-start: 1em;
            margin-block-end: 0.5em;
            img {
                max-width: 50%;
                border-radius: var(--border-radius-standard);
                box-shadow: 0 0 20px rgba(0, 0, 0, 1);
            }
        }
    }
</style>
