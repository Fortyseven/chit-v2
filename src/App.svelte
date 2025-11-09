<script>
    import { SvelteToast } from "@zerodevx/svelte-toast"
    import InputBar from "./app/Chat/InputBar/InputBar.svelte"
    import ChatHeader from "./app/Chat/Timeline/ChatHeader/ChatHeader.svelte"
    import ConvoSidebar from "./app/ChatSidebar/Sidebar.svelte"
    import PageContent from "./app/PageContent.svelte"
    import AppFramework from "./app/UI/AppFramework/AppFramework.svelte"

    import "./lib/appState/appStateStorage"
    import "./lib/audio"
    import { AppMode, currentChatMode } from "./lib/chatSession/chatSession"
    import "./lib/chatSession/chatStorage"

    const toastOptions = {
        //...
    }
</script>

<AppFramework>
    <div
        slot="sidebar"
        class="sidebar"
        class:rp-mode={$currentChatMode === AppMode.RP}
    >
        <ConvoSidebar />
    </div>
    <div
        slot="content"
        class="page"
        class:rp-mode={$currentChatMode === AppMode.RP}
    >
        <PageContent />
        <div class="chat-header"><ChatHeader /></div>
        <div class="input-bar"><InputBar /></div>
    </div>
</AppFramework>
<SvelteToast options={toastOptions} />

<style lang="scss">
    .page {
        box-sizing: border-box;
        width: inherit;
        overflow-y: hidden;
        position: relative;

        &.rp-mode {
            // Add subtle RP mode styling
            border-left: 3px solid var(--color-accent-complement);
            background-color: color-mix(
                in srgb,
                var(--color-background) 95%,
                var(--color-accent-complement) 5%
            );
        }
    }

    .sidebar {
        &.rp-mode {
            // RP mode styling for sidebar
            background-color: color-mix(
                in srgb,
                var(--color-background) 97%,
                var(--color-accent-complement) 3%
            );
        }
    }

    .chat-header {
        width: stretch;
        height: auto;
        position: fixed;
        top: 0;
        z-index: 50;
    }

    .input-bar {
        width: stretch;

        position: fixed;
        bottom: 0;
        z-index: 50;
    }
</style>
