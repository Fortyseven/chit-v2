<script>
    import ChatLogRegular_Assistant from "./ChatLogRegular_Assistant.svelte"

    import { currentConvo } from "../../../stores/chatState.svelte.js"
</script>

<div class="bg-surface-900 h-full background-grid">
    {#if $currentConvo.chatState.timeline}
        <div class="chatlog">
            {#each $currentConvo.chatState.timeline as timeline_entry, i}
                {#if timeline_entry.role === "user"}
                    <div class="response user">
                        {timeline_entry.content}
                    </div>
                {:else}
                    <ChatLogRegular_Assistant line={timeline_entry.content}
                    ></ChatLogRegular_Assistant>
                {/if}
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
    }
    .response {
        border-radius: 0.5em;
        box-shadow: 0 0.25em 0.25em 0 #000;
        text-align: start;
        padding: 0.5em;
        font-size: 1.1em;

        &.user {
            box-shadow: none;
            color: rgb(var(--color-surface-300));
            flex: auto;
            font-size: 1em;
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

        &.bot {
            background-image: linear-gradient(
                140deg,
                #ffffff0e 0%,
                rgba(0, 0, 0, 0.73) 100%
            );
            border-bottom: 1px solid #fff1;
            // border-top-left-radius: unset;
            color: rgb(var(--color-primary-300));
        }
    }
</style>
