<script>
    // @ts-nocheck

    import {
        AppBar,
        AppRail,
        AppRailAnchor,
        AppRailTile,
        AppShell,
    } from "@skeletonlabs/skeleton"

    import ConvoSidebar from "$app/Convos/ConvoSidebar.svelte"

    import "$stores/appState.svelte.js"

    import llm from "$lib/llm/ollama.svelte.js"
    import API from "./app/API.svelte"
    import InputBar from "./app/Chat/InputBar/InputBar.svelte"
    import ChatLogRegular from "./app/Chat/Timeline/ChatLogRegular.svelte"
    import EventRepeater from "./app/EventRepeater.svelte"

    import ChatKnobs from "./app/Chat/ChatKnobs/ChatKnobs.svelte"
    import {
        chatSessions,
        currentChatSession,
    } from "./stores/chatSessions.svelte.js"
</script>

<EventRepeater>
    <!-- <API> -->
    <AppShell class="h-full ">
        {#snippet header()}
            <AppBar
                gridColumns="grid-cols-3"
                slotDefault="place-self-center"
                slotTrail="place-content-end"
                background="bg-surface-700"
            >
                {#snippet lead()}
                    <button class="btn variant-filled-secondary">
                        Config
                    </button>
                {/snippet}

                {#snippet trail()}{/snippet}
            </AppBar>
        {/snippet}

        {#snippet sidebarLeft()}
            <ConvoSidebar />
        {/snippet}

        {#snippet pageHeader()}{/snippet}

        <div class="page h-full w-full">
            <div
                class="sticky h-auto top-0 z-50 bg-neutral-800 align-middle m-auto flex flex-col place-content-center"
            >
                <div
                    class="p-2 text-lg text-primary-500 font-bold flex-auto text-nowrap text-ellipsis overflow-hidden w-3/4 md:w-full md:text-2xl"
                >
                    {$currentChatSession.title}
                </div>
                <div class="flex-auto place-self-center w-full">
                    <ChatKnobs></ChatKnobs>
                </div>
            </div>
            <div class="h-full overflow-y-auto flex-col pb-24">
                <ChatLogRegular></ChatLogRegular>
            </div>
            <div class="input-bar">
                <InputBar></InputBar>
            </div>
        </div>
    </AppShell>
    <!-- </API> -->
</EventRepeater>

<style lang="scss">
    :global(.app-rail button) {
        border-radius: 0;
        background: transparent;
    }

    .input-bar {
        position: sticky;
        bottom: 0;
    }
</style>
