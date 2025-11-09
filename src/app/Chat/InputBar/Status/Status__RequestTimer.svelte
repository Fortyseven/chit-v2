<script lang="ts">
    import { Recycle as Wait } from "carbon-icons-svelte"
    import { currentChat } from "../../../../lib/chatSession/chatSession"

    let time = NaN
    let cps = NaN
    let finished = false

    $: if ($currentChat && $currentChat?.lastRequestStart) {
        finished =
            $currentChat?.lastRequestTimer > $currentChat?.lastRequestStart
        if (finished) {
            time =
                ($currentChat.lastRequestTimer -
                    $currentChat.lastRequestStart) /
                1000
            cps = $currentChat.lastTokenCount / time
        } else {
            // live update during streaming
            time = (Date.now() - $currentChat.lastRequestStart) / 1000
            cps = $currentChat.lastTokenCount / (time > 0 ? time : 1)
        }
    }
</script>

<div class="request-timer">
    <div class="timer">
        {#if !isNaN(time) && time > 0}
            {time.toFixed(2)}s
        {:else}
            <div class="rotate"><Wait /></div>
        {/if}
    </div>
    <div class="cps">
        {#if !isNaN(cps) && cps > 0}
            {Math.round(cps)} cps
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
        .cps {
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
