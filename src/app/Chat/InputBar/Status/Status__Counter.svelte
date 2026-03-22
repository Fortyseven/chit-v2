<script lang="ts">
    import { currentChat } from "$lib/chatSession/chatSession"
    import { estimateTokens } from "$lib/text/tokenEstimate"

    export let inputLength = 0
    export let systemPromptLength = 0

    $: contextLimit = $currentChat?.settings?.num_ctx || 0
    $: systemPromptLength = estimateTokens(
        $currentChat?.systemPrompt?.length || 0,
    )
    $: conversationLength = estimateTokens(
        $currentChat?.messages?.reduce((acc, message) => {
            return acc + (message?.content?.length || 0)
        }, 0) || 0,
    )

    $: inputTokens = estimateTokens(inputLength)
    $: fullChatLength = systemPromptLength + conversationLength + inputTokens
    $: overflow = fullChatLength >= contextLimit

    $: title =
        [
            Math.round(inputTokens),
            Math.round(systemPromptLength),
            Math.round(conversationLength),
        ].join(" + ") +
        ` = ${Math.round(fullChatLength)} / ${contextLimit} tokens (input, system, conversation)`
</script>

<div class="counter">
    <meter
        id="ContextMeter"
        min="0"
        max={contextLimit}
        high={contextLimit * 0.8}
        value={fullChatLength}
        {title}
        class:overflow
    ></meter>
</div>

<style lang="scss">
    .counter {
        width: 100%;

        #ContextMeter {
            width: 100%;
            height: 1em;
            overflow: hidden;
            position: relative;
            background: linear-gradient(to bottom, #333 25%, #666 100%);
            &.overflow {
                color: #f00;
                outline: 3px solid #f00;

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
    }
</style>
