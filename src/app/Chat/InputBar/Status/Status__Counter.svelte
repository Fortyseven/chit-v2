<script lang="ts">
    import { currentChat } from "../../../../lib/chatSession/chatSession"

    export let inputLength = 0
    export let systemPromptLength = 0

    $: contextLimit = $currentChat?.settings?.num_ctx || 0
    $: systemPromptLength = $currentChat?.system_prompt?.length || 0
    $: conversationLength =
        $currentChat?.messages?.reduce((acc, message) => {
            return acc + (message?.content?.length || 0)
        }, 0) || 0

    $: fullChatLength = systemPromptLength + conversationLength + inputLength
    $: overflow = fullChatLength >= contextLimit
</script>

<div class="counter">
    {#if inputLength + systemPromptLength > 0}
        {#if inputLength}
            <span title="User tokens" class="user-input">
                {inputLength}
            </span>
        {/if}
        {#if inputLength && systemPromptLength}
            +
        {/if}
        {#if systemPromptLength}
            <span title="System prompt tokens" class="system-prompt">
                {systemPromptLength}
            </span>
        {/if}
        {#if systemPromptLength && conversationLength}
            +
        {/if}
        {#if conversationLength}
            <span title="Current conversation length">
                {conversationLength}
            </span>
        {/if}
        <span>=</span>
        <span class:overflow title="Proposed combined tokens" class="total">
            {fullChatLength}
        </span>
    {/if}
</div>

<style lang="scss">
    .counter {
        text-align: center;
        font-family: monospace;
        text-transform: uppercase;
        letter-spacing: -1px;

        color: var(--color-accent);

        .total {
            color: var(--color-accent-success-lighter);

            &.overflow {
                color: #f00;
                font-weight: bold;
                // pulse
                @keyframes pulse {
                    0% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                    100% {
                        opacity: 1;
                    }
                }
                animation: pulse 1.5s infinite;
            }
        }
        .system-prompt {
            color: var(--color-accent-complement);
            font-weight: bold;
        }

        .user-input {
            color: var(--color-text);
            font-weight: bold;
        }
    }
</style>
