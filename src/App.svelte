<script>
    // @ts-nocheck

    import ConvoSidebar from "./app/ChatSidebar/Sidebar.svelte"

    // import "$stores/appState.svelte.js"

    import llm from "$lib/llm/ollama"
    import API from "./app/API.svelte"
    import InputBar from "./app/Chat/InputBar/InputBar.svelte"
    import ChatLogRegular from "./app/Chat/Timeline/Regular/ChatLogRegular.svelte"
    import EventRepeater from "./app/EventRepeater.svelte"

    import ChatKnobs from "./app/Chat/ChatKnobs/ChatKnobs.svelte"

    import { currentChat } from "./chatSession/chatSession"

    import { afterUpdate, onMount } from "svelte"
    import "./chatSession/appStateStorage"
    import "./chatSession/chatStorage"

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
                    {$currentChat.title}
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
    }

    .chatlog {
        display: flex;
        flex: 1 0 auto;
        flex-direction: column;
        gap: 0.5em;
        width: 100%;
        max-width: 1280px;
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
