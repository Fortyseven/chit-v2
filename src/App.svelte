<script>
    import ChatHeader from "./app/Chat/ChatHeader.svelte"

    import { afterUpdate } from "svelte"

    import InputBar from "./app/Chat/InputBar/InputBar.svelte"
    import ConvoSidebar from "./app/ChatSidebar/Sidebar.svelte"
    import PageContent from "./app/PageContent.svelte"
    import AppFramework from "./app/UI/AppFramework/AppFramework.svelte"

    import { currentChat } from "./lib/chatSession/chatSession"

    import "./lib/appState/appStateStorage"
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

<AppFramework>
    <div slot="sidebar">
        <ConvoSidebar />
    </div>
    <div slot="content" class="page" bind:this={scrollWindowEl}>
        <PageContent />
        <div class="chat-header"><ChatHeader /></div>
        <div class="input-bar"><InputBar /></div>
    </div>
</AppFramework>

<style lang="scss">
    .page {
        box-sizing: border-box;
        width: inherit;
        overflow-y: scroll;
        position: relative;
    }

    .chat-header {
        // width: -moz-available;
        // width: -webkit-fill-available;
        width: stretch;
        height: auto;
        position: fixed;
        top: 0;
        z-index: 50;
        border: 1px dashed yellow;
    }

    .input-bar {
        // width: -moz-available;
        // width: -webkit-fill-available;
        width: stretch;

        position: fixed;
        bottom: 0;
        z-index: 50;
    }
</style>
