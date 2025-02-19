<script>
    // @ts-nocheck

    import {
        AppBar,
        AppRail,
        AppRailAnchor,
        AppRailTile,
        AppShell,
    } from "@skeletonlabs/skeleton"

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
    import "./chatSession/chatStorage"

    let scrollWindowEl = undefined

    // afterUpdate(() => {
    //     // if (scrollWindowEl) {
    //     scrollToBottom(scrollWindowEl)
    //     // }
    // })

    // const scrollToBottom = async (node) => {
    //     node.scroll({ top: node.scrollHeight, behavior: "smooth" })
    // }

    // onMount(() => {
    //     setInterval(() => {
    //         scrollWindowEl?.scrollTop(scrollWindowEl.scrollHeight)
    //         console.log("scrolling", scrollWindowEl)
    //     }, 1000)
    // })
</script>

<!-- <EventRepeater> -->
<!-- <API> -->
<AppShell class="h-full ">
    <svelte:fragment slot="header">
        <AppBar
            gridColumns="grid-cols-3"
            slotDefault="place-self-center"
            slotTrail="place-content-end"
            background="bg-surface-700"
        >
            <!-- <svelte:fragment slot="lead"></svelte:fragment> -->
            <!-- <svelte:fragment slot="trail"></svelte:fragment> -->
        </AppBar>
    </svelte:fragment>

    <svelte:fragment slot="sidebarLeft">
        <ConvoSidebar />
    </svelte:fragment>

    <!-- <svelte:fragment slot="pageHeader"></svelte:fragment> -->

    <div class="page h-full w-full debug1">
        <div
            class="sticky h-auto top-0 z-50 bg-neutral-800 align-middle m-auto flex flex-col place-content-center"
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
        </div>
        <div class="flex-col debug2 chatlog" bind:this={scrollWindowEl}>
            <ChatLogRegular></ChatLogRegular>
        </div>
        <div class="input-bar">
            <InputBar></InputBar>
        </div>
    </div>
</AppShell>

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

    .chatlog {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        width: full;
        max-width: 1024px;
        margin: auto;
        padding-inline: 1em;
        font-size: 1.2em;
        padding-top: 0.5em;
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
