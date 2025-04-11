<script>
    import { afterUpdate } from "svelte"

    import ChatLogRegular from "./Chat/Timeline/Regular/ChatLogRegular.svelte"

    import { currentChat } from "../lib/chatSession/chatSession"

    import "../appState/appStateStorage"
    import "../lib/audio"
    import "../lib/chatSession/chatStorage"

    let scrollWindowEl = undefined

    function scrollDown() {
        setTimeout(
            () => scrollWindowEl?.scrollTo(0, scrollWindowEl.scrollHeight),
            50,
        )
    }

    currentChat.subscribe(scrollDown)

    afterUpdate(scrollDown)
</script>

<div class="page">
    <ChatLogRegular />
</div>

<style lang="scss">
    .page {
        // display: block;
        box-sizing: border-box;
        width: inherit;
        height: 100%;
        overflow-y: scroll;
        // position: relative;
        border: 2px dashed green;

        --s: 8px; /* control the size*/
        --c1: var(--color-surface-950);
        --c2: var(--color-surface-800);
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
    }
</style>
