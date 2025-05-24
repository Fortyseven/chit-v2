<script lang="ts">
    import { Recycle as Wait } from "carbon-icons-svelte"
    import { currentChat } from "../../../../lib/chatSession/chatSession"

    let time = 0

    $: if ($currentChat) {
        time = $currentChat?.lastRequestFinish - $currentChat?.lastRequestStart
    }
</script>

<div class="request-timer">
    <div class="timer" title={`${time}ms`}>
        {#if time > 0}
            {time / 1000}s
        {:else}
            <div class="rotate"><Wait /></div>
        {/if}
    </div>
</div>

<style lang="scss">
    .timer {
        color: var(--color-accent-complement-lighter);
        margin-right: 0.5em;
        font-family: monospace;

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
</style>
