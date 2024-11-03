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
    import ChatLog from "./app/Chat/ChatLog.svelte"
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


    <div class="page h-full">
        <div class="h-full overflow-y-auto flex-col">
            <ChatLog></ChatLog>
        </div>

        <div class="input-group input-group-divider grid-cols-[auto_1fr_auto] rounded-container-token absolute bottom-0">
	        <button class="input-group-shim">+</button>
	        <textarea
                class="bg-transparent border-0 ring-0"
                name="prompt"
                id="prompt"
                placeholder="Write a message..."
                rows="1">
            </textarea>
            <button class="variant-filled-primary">Send</button>
        </div>
    </div>
</AppShell>

<style lang="scss">
    :global(.app-rail button) {
        border-radius: 0;
        background: transparent;
    }
</style>