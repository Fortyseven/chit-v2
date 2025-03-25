<script>
    // @ts-nocheck

    import ConvoSidebar from "./app/ChatSidebar/Sidebar.svelte"

    // import "$stores/appState.svelte.js"

    import llm from "$lib/llm/ollama"

    import InputBar from "./app/Chat/InputBar/InputBar.svelte"
    import ChatLogRegular from "./app/Chat/Timeline/Regular/ChatLogRegular.svelte"

    import ChatKnobs from "./app/Chat/ChatKnobs/ChatKnobs.svelte"

    import { currentChat } from "./lib/chatSession/chatSession"

    import { afterUpdate, onMount } from "svelte"
    import "./appState/appStateStorage"
    import "./lib/audio"
    import "./lib/chatSession/chatStorage"
    import AppFramework from "./ui/AppFramework/AppFramework.svelte"

    let scrollWindowEl = undefined

    afterUpdate(() => {
        scrollWindowEl?.scrollTo(0, scrollWindowEl.scrollHeight)
    })
</script>

<div class="flex h-full w-full">
    <div class="flex-grow-0 w-[400px] h-full shadow-2xl">
        <ConvoSidebar />
    </div>

    <div class="page" bind:this={scrollWindowEl}>
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
        <div class="chatlog">
            <ChatLogRegular></ChatLogRegular>
        </div>
        <footer class="input-bar flex-auto flex-grow-0">
            <InputBar></InputBar>
        </footer>
    </div>
</div>

<!-- </API> -->
<!-- </EventRepeater> -->

<style lang="scss">
    :global(.app-rail button) {
        border-radius: 0;
        background: transparent;
    }

    .input-bar {
        position: sticky;
        bottom: 0;
    }

    .page {
        overflow: scroll;
        width: 100%;
        height: 100%;
        flex-direction: column;
        display: flex;

        --s: 8px; /* control the size*/
        --c1: rgb(var(--color-surface-950));
        --c2: rgb(var(--color-surface-800));
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

    header {
        // box-shadow: 0 0 1em #000;
        background: #fb01;
        backdrop-filter: blur(15px);
        filter: drop-shadow(0 0 2em #000);
    }

    .chatlog {
        display: flex;
        flex: 1 0 auto;
        flex-direction: column;
        gap: 0.5em;
        width: 100%;
        max-width: 1024px;
        margin: auto;
        padding-inline: 1em;
        padding-block-end: 4em;
        font-size: 1.2em;
        padding-top: 0.5em;
        place-content: start;
        font-family:
            "Roboto",
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            Oxygen,
            Ubuntu,
            Cantarell,
            "Open Sans",
            "Helvetica Neue",
            sans-serif;
    }
</style>
