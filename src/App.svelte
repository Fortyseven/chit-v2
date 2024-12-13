<script>
    // @ts-nocheck

    import {
        AppBar,
        AppRail,
        AppRailAnchor,
        AppRailTile,
        AppShell,
    } from "@skeletonlabs/skeleton"

    import ConvoPanel from "$app/Convos/ConvoPanel.svelte"

    import "$stores/appState.svelte.js"

    import llm from "$lib/llm/ollama.svelte.js"
    import API from "./app/API.svelte"
    import ChatLogRegular from "./app/Chat/ChatLogRegular.svelte"
    import InputBar from "./app/Chat/InputBar/InputBar.svelte"
    import EventRepeater from "./app/EventRepeater.svelte"
    // import { currentConvoIndex } from "./stores/appState.svelte"

    import ChatKnobs from "./app/Chat/ChatKnobs/ChatKnobs.svelte"
    import { convos, currentConvo } from "./stores/chatState.svelte.js"
</script>

<EventRepeater>
    <API>
        <AppShell class="h-full">
            {#snippet header()}
                <AppBar
                    gridColumns="grid-cols-3"
                    slotDefault="place-self-center"
                    slotTrail="place-content-end"
                    background="bg-surface-700"
                >
                    {#snippet lead()}
                        <!-- <button class="btn variant-filled-secondary">Menu</button> -->
                    {/snippet}

                    <div
                        class="text-lg text-primary-500 font-bold text-nowrap text-ellipsis overflow-hidden w-3/4 md:w-full md:text-2xl"
                    >
                        {$currentConvo.title}
                    </div>

                    {#snippet trail()}
                        <!-- Bar -->
                    {/snippet}
                </AppBar>
            {/snippet}

            {#snippet sidebarLeft()}
                <ConvoPanel />
            {/snippet}

            {#snippet pageHeader()}{/snippet}

            <div class="page h-full w-full relative">
                <ChatKnobs></ChatKnobs>
                <div class="h-full overflow-y-auto flex-col pb-24">
                    <ChatLogRegular></ChatLogRegular>
                </div>
                <div class="input-bar">
                    <InputBar></InputBar>
                </div>
            </div>
        </AppShell>
    </API>
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
