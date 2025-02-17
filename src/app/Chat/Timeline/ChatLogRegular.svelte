<script>
    import { activeChatId, currentChat } from "../../../chatSession/chatSession"
    import ChatLogRegular_Assistant from "./ChatLogRegular_Assistant.svelte"
</script>

<div class="bg-surface-900 h-full background-grid bg-fixed">
    <!-- {#if $currentChatSession.conversation.timeline} -->
    {#if $activeChatId && $currentChat.messages}
        <div class="chatlog">
            {#each $currentChat.messages as messages, i}
                {#key messages}
                    {#if messages.role === "user"}
                        <div class="response user">
                            {messages.content}
                        </div>
                    {:else}
                        <ChatLogRegular_Assistant line={messages.content}
                        ></ChatLogRegular_Assistant>
                    {/if}
                {/key}
            {/each}
        </div>
    {/if}
</div>

<style lang="scss">
    .chatlog {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        width: full;
        max-width: 1024px;
        margin: auto;
        padding-inline: 1em;
        font-size: 1.1em;
    }
    .response {
        border-radius: 0.5em;
        box-shadow: 0 0.25em 0.25em 0 #000;
        text-align: start;
        padding: 0.5em;
        // font-size: 1.2em;
        // font-size: 2em;

        &.user {
            box-shadow: none;
            color: rgb(var(--color-surface-300));
            flex: auto;
            // font-size: 1em;
            font-style: italic;
            line-height: 1.35em;
            overflow: scroll;
            width: 100%;
            &::before {
                content: "> ";
                font-weight: bold;
            }
            opacity: 0.75;
        }

        // &.bot {
        //     // background-image: linear-gradient(
        //     //     140deg,
        //     //     #ffffff0e 0%,
        //     //     rgba(0, 0, 0, 0.73) 100%
        //     // );
        //     border-bottom: 1px solid #fff1;
        //     // border-top-left-radius: unset;
        //     color: rgb(var(--color-primary-300));
        //     backdrop-filter: blur(3px) brightness(120%);
        // }
    }
</style>
