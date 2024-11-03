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

    import llm from '$lib/llm/ollama.svelte.js'
    import ChatLogRegular from "./app/Chat/ChatLogRegular.svelte"
    import InputBar from "./app/Chat/InputBar/InputBar.svelte"
    import { appState } from "./stores/appState.svelte"
    import { convos } from "./stores/chatState.svelte.js"
</script>


<AppShell class="h-full">
    {#snippet header()}
        <AppBar gridColumns="grid-cols-3" slotDefault="place-self-center" slotTrail="place-content-end">
            {#snippet lead()}
                <button class="btn variant-filled-secondary">Menu</button>
            {/snippet}

            <div class="text-lg text-primary-500 font-bold text-nowrap text-ellipsis overflow-hidden w-3/4 md:w-full md:text-2xl">
                {convos.entries[appState.currentConvoIndex].title}
            </div>

            {#snippet trail()}
            <!-- Bar -->
            {/snippet}
        </AppBar>
    {/snippet}

    {#snippet sidebarLeft()}
        <ConvoPanel/>
    {/snippet}

    {#snippet pageHeader()}
        [I am a page header.]
    {/snippet}


    <div class="page h-full w-full relative">
        <div class="h-full overflow-y-auto flex-col pb-24">
            <ChatLogRegular></ChatLogRegular>
        </div>
        <div class="input-bar" >
            <InputBar></InputBar>
        </div>

    </div>
</AppShell>

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