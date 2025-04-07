<script>
    import InputBar from "./app/Chat/InputBar/InputBar.svelte"
    import ChatLogRegular from "./app/Chat/Timeline/Regular/ChatLogRegular.svelte"

    import ChatKnobs from "./app/Chat/ChatKnobs/ChatKnobs.svelte"

    import { currentChat } from "./lib/chatSession/chatSession"

    import { afterUpdate } from "svelte"
    import "./appState/appStateStorage"
    import "./lib/audio"
    import "./lib/chatSession/chatStorage"

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

<header
    class="sticky w-full h-auto top-0 z-50 bg-neutral-800 align-middle m-auto flex flex-col place-content-center"
>
    {#if $currentChat}
        <div
            class="p-2 text-lg text-primary-500 font-bold flex-auto text-nowrap text-ellipsis overflow-hidden w-3/4 md:w-full md:text-2xl"
        >
            {#key $currentChat}
                {$currentChat.title}
            {/key}
        </div>
        <div class="flex-auto place-self-center w-full">
            <ChatKnobs></ChatKnobs>
        </div>
    {:else}
        <div class="p-2 text-lg text-primary-500 font-bold">
            No chat selected
        </div>
    {/if}
</header>
<ChatLogRegular />
<!-- <div class="input"> -->
<InputBar />

<!-- </div> -->

<style lang="scss">
    .page {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        overflow: scroll;
        position: relative;

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

        header {
            background: #fb01;
            backdrop-filter: blur(15px);
            filter: drop-shadow(0 0 2em #000);
            position: sticky;
            width: 100%;
            top: 0;
        }
    }
</style>
