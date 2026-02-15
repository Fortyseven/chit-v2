<script>
    import { afterUpdate } from "svelte"

    import ChatLogRegular from "./Chat/Timeline/Regular/ChatLogRegular.svelte"

    import { currentChat } from "$lib/chatSession/chatSession"

    import "$lib/appState/appStateStorage"
    import "$lib/audio"
    import "$lib/chatSession/chatStorage"

    /* This allows the page to scroll when the chat is updated. */

    let scrollWindowEl = undefined
    let isStreaming = false

    function scrollDown() {
        setTimeout(
            () => scrollWindowEl?.scrollTo(0, scrollWindowEl.scrollHeight),
            50,
        )
    }

    // Track streaming state to reduce scroll thrashing during token streaming
    currentChat.subscribe(($chat) => {
        isStreaming = ($chat?.response_buffer?.length ?? 0) > 0
        // Only scroll if not streaming (avoid layout thrashing)
        if (!isStreaming) {
            scrollDown()
        }
    })

    // Scroll after component updates, but only if streaming has completed
    afterUpdate(() => {
        if (isStreaming) {
            return // Skip scroll updates during streaming
        }
        scrollDown()
    })
</script>

<div class="page" bind:this={scrollWindowEl}>
    <ChatLogRegular />
</div>

<style lang="scss">
    .page {
        box-sizing: border-box;
        width: inherit;
        height: 100%;
        overflow-y: auto;

        z-index: 5;

        --s: 8px; /* control the size*/
        --c1: var(--color-background-darker);
        --c2: var(--color-background);
        --c: #0000, var(--c1) 0.5deg 119.5deg, #0000 120deg;
        --g1: conic-gradient(from 60deg at 56.25% calc(425% / 6), var(--c));
        --g2: conic-gradient(from 180deg at 43.75% calc(425% / 6), var(--c));
        --g3: conic-gradient(from -60deg at 50% calc(175% / 12), var(--c));

        background:
            var(--g1),
            var(--g1) var(--s) calc(1.73 * var(--s)),
            var(--g2),
            var(--g2) var(--s) calc(1.73 * var(--s)),
            var(--g3) var(--s) 0,
            var(--g3) 0 calc(1.73 * var(--s)) var(--c2);
        background-size: calc(2 * var(--s)) calc(3.46 * var(--s));

        :global(*) {
            z-index: 7;
            // display: none;
        }

        &::after {
            z-index: 6;
            // overlay image
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            mix-blend-mode: color;

            background: linear-gradient(
                to bottom,
                #150e15 0%,
                #160f15 3.23%,
                #160f15 6.45%,
                #160f15 9.68%,
                #170f15 12.9%,
                #170f15 16.13%,
                #170f16 19.35%,
                #181016 22.58%,
                #181016 25.81%,
                #191016 29.03%,
                #191016 32.26%,
                #1a1117 35.48%,
                #1a1117 38.71%,
                #1b1117 41.94%,
                #1c1217 45.16%,
                #1d1218 48.39%,
                #1d1218 51.61%,
                #1f1318 54.84%,
                #201318 58.06%,
                #211418 61.29%,
                #221418 64.52%,
                #241518 67.74%,
                #261517 70.97%,
                #281617 74.19%,
                #2a1616 77.42%,
                #2c1614 80.65%,
                #2f1612 83.87%,
                #31150f 87.1%,
                #33140b 90.32%,
                #311007 93.55%,
                #290b03 96.77%,
                #170501 100%
            );
        }
    }
</style>
