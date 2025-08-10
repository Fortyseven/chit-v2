<script>
    import { SvelteToast } from "@zerodevx/svelte-toast"
    import InputBar from "./app/Chat/InputBar/InputBar.svelte"
    import ChatHeader from "./app/Chat/Timeline/ChatHeader/ChatHeader.svelte"
    import ConvoSidebar from "./app/ChatSidebar/Sidebar.svelte"
    import PageContent from "./app/PageContent.svelte"
    import AppFramework from "./app/UI/AppFramework/AppFramework.svelte"

    import "./lib/appState/appStateStorage"
    import "./lib/audio"
    import "./lib/chatSession/chatStorage"

    const toastOptions = {
        //...
    }
</script>

<AppFramework>
    <div slot="sidebar">
        <ConvoSidebar />
    </div>
    <div slot="content" class="page">
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
