<script>
    import { appState } from "../../../../chatSession/appState"
    import { currentChat } from "../../../../chatSession/chatSession"
    import ChatLogRegular_Assistant from "./ChatLogRegular_Assistant.svelte"
    import ChatLogRegular_User from "./ChatLogRegular_User.svelte"
</script>

{#if $appState.activeChatId && $currentChat?.messages}
    {#each $currentChat.messages as messages, i}
        {#key messages}
            {#if messages.role === "user"}
                <ChatLogRegular_User line={messages.content}
                ></ChatLogRegular_User>
            {:else}
                <ChatLogRegular_Assistant line={messages.content}
                ></ChatLogRegular_Assistant>
            {/if}
        {/key}
    {/each}
{/if}

<style lang="scss">
</style>
