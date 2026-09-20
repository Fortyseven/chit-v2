<script lang="ts">
    import { currentChat } from "$lib/chatSession/chatSession"
    import { streamingState } from "$lib/chatSession/streamingState"
    import {
        routerSlotStatus,
        slotPolledModel,
    } from "$lib/llm/routerModels"
    import { Refresh } from "svelte-google-materialdesign-icons"

    let time = NaN
    let tps = NaN
    let finished = false

    // Server-reported values for the current request (real tokens/sec and
    // generated token total from llama.cpp slot polling). Captured locally
    // because polling stops when the request finishes.
    let realTps = NaN
    let realTokens = NaN
    let trackedStart: number | undefined

    // A new request (or chat switch) invalidates captured values
    $: if ($currentChat?.lastRequestStart !== trackedStart) {
        trackedStart = $currentChat?.lastRequestStart
        realTps = NaN
        realTokens = NaN
    }

    // Slot status only counts while polling the current model's slots
    $: serverStats =
        slotPolledModel() === $currentChat?.model_name
            ? $routerSlotStatus
            : null

    $: if (serverStats) {
        realTokens = serverStats.usedTokens - serverStats.promptTokens
        const liveTps = serverStats.tokensPerSec
        if (liveTps !== undefined && liveTps > 0) {
            realTps = liveTps
        }
    }

    $: if ($currentChat && $currentChat?.lastRequestStart) {
        finished =
            $currentChat?.lastRequestTimer > $currentChat?.lastRequestStart
        if (finished) {
            time =
                ($currentChat.lastRequestTimer -
                    $currentChat.lastRequestStart) /
                1000
            // Prefer the server's real token total over the chars/4 estimate
            tps =
                realTokens > 0
                    ? realTokens / time
                    : $currentChat.lastTokenCount / time
        } else {
            // Live update during streaming: real tokens/sec from slot
            // polling, estimated rate until samples exist
            time = (Date.now() - $currentChat.lastRequestStart) / 1000
            tps =
                realTps > 0
                    ? realTps
                    : $streamingState.lastTokenCount / (time > 0 ? time : 1)
        }
    }
</script>

<div class="request-timer">
    <div class="timer">
        {#if !isNaN(time) && time > 0}
            {time.toFixed(2)}s
        {:else}
            <div class="rotate"><Refresh /></div>
        {/if}
    </div>
    <div class="tps">
        {#if !isNaN(tps) && tps > 0}
            {Math.round(tps)} tps
        {/if}
    </div>
</div>

<style lang="scss">
    .request-timer {
        display: flex;
        & > div {
            flex: auto;
        }
        .timer,
        .tps {
            color: var(--color-accent-complement-lighter);
            margin-right: 0.5em;
            font-family: monospace;
            font-size: 0.8rem;

            .rotate {
                animation: rotate 1s linear infinite;
                line-height: 0;
                transform-origin: center;
                color: var(--color-accent);
            }
            @keyframes rotate {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }
        }
    }
</style>
