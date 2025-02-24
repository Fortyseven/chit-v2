<script>
    import { appState } from "../../../../appState/appState"
    import {
        chatGetStreamingPending,
        chatInProgressWithId,
    } from "../../../../chatSession/chatActions"
    import { currentChat } from "../../../../chatSession/chatSession"
    import ChatLogRegular_Assistant from "./ChatLogRegular_Assistant.svelte"
    import ChatLogRegular_User from "./ChatLogRegular_User.svelte"
</script>

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
            <ChatLogRegular_Assistant line={chatGetStreamingPending()}
            ></ChatLogRegular_Assistant>
        {/if}
    {/key}
{/if}

<style lang="scss">
</style>
