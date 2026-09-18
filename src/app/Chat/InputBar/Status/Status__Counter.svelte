<script lang="ts">
    import { chatInProgress } from "$lib/chatSession/chatActions"
    import { currentChat } from "$lib/chatSession/chatSession"
    import { llmDriver } from "$lib/llm/llm"
    import type { RouterDriver } from "$lib/llm/routerModels"
    import {
        routerSlotStatus,
        slotPolledModel,
        startSlotPolling,
        stopSlotPolling,
    } from "$lib/llm/routerModels"
    import { estimateTokens } from "$lib/text/tokenEstimate"

    export let inputLength = 0
    export let systemPromptLength = 0

    // Live server-side context fill for the current model (null when the
    // router can't report it, or the polled model is a different one).
    $: serverFill =
        slotPolledModel() === $currentChat?.model_name
            ? $routerSlotStatus
            : null

    // Poll the current model's slots at 1Hz while a response is generating
    let pollingChatId: string | undefined = undefined
    $: {
        const chatId = $currentChat?.id
        const model = $currentChat?.model_name
        if (
            $chatInProgress &&
            chatId &&
            model &&
            $llmDriver?.getRouterSlots
        ) {
            if (pollingChatId !== chatId) {
                pollingChatId = chatId
                void startSlotPolling($llmDriver as RouterDriver, model)
            }
        } else if (pollingChatId !== undefined) {
            pollingChatId = undefined
            stopSlotPolling()
        }
    }

    $: contextLimit = serverFill?.ctxTokens || $currentChat?.settings?.num_ctx || 0
    $: systemPromptLength = estimateTokens(
        ($currentChat?.systemPrompt?.length || 0) +
            ($currentChat?.subPrompts?.reduce(
                (acc, sp) => acc + (sp.enabled ? sp.text.length : 0),
                0
            ) || 0)
    )
    $: conversationLength = estimateTokens(
        $currentChat?.messages?.reduce((acc, message) => {
            return acc + (message?.content?.length || 0)
        }, 0) || 0,
    )

    $: inputTokens = estimateTokens(inputLength)
    // Prefer the server's real context occupancy over the client estimate
    $: fullChatLength =
        serverFill !== null ? serverFill.usedTokens : systemPromptLength + conversationLength + inputTokens
    $: overflow = fullChatLength >= contextLimit

    $: title =
        serverFill !== null
            ? `${serverFill.usedTokens} / ${serverFill.ctxTokens} tokens on server (prompt ${serverFill.promptTokens}, generated ${serverFill.usedTokens - serverFill.promptTokens})${serverFill.tokensPerSec ? ` · ${serverFill.tokensPerSec} tok/s` : ""}`
            : [
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
