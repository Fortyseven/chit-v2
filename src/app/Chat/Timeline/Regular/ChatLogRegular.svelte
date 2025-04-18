<script>
    import { afterUpdate } from "svelte"
    import { appState } from "../../../../lib/appState/appState"
    import {
        chatGetStreamingPending,
        chatInProgressWithId,
    } from "../../../../lib/chatSession/chatActions"
    import { currentChat } from "../../../../lib/chatSession/chatSession"
    import ChatLogRegular_Assistant from "./ChatLogRegular_Assistant.svelte"
    import ChatLogRegular_User from "./ChatLogRegular_User.svelte"
</script>

<div class="wrapper" id="ChatLogRegular">
    {#if $appState.activeChatId && $currentChat?.messages}
        {#each $currentChat.messages as messages, i}
            {#key messages}
                {#if messages.role === "user" && messages.content}
                    <ChatLogRegular_User line={messages.content}
                    ></ChatLogRegular_User>
                {:else if messages.role === "user" && !messages.content}
                    <!-- cont'd -->
                {:else}
                    <ChatLogRegular_Assistant line={messages.content}
                    ></ChatLogRegular_Assistant>
                {/if}
            {/key}
        {/each}

        {#key $currentChat}
            {#if chatInProgressWithId($appState.activeChatId)}
                <ChatLogRegular_Assistant line={chatGetStreamingPending()} inprogress
                ></ChatLogRegular_Assistant>
            {/if}
            ---
            {#if $currentChat?.media_attachments}
                {#each $currentChat.media_attachments as attachment}
                    <div class="media-attachment">
                        <p>Media: {attachment}</p>
                    </div>
                {/each}
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
    }
</style>
