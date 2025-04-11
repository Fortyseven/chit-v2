<script>
  import ChatHeader from './ChatHeader.svelte'

    import { afterUpdate } from "svelte"

    import ChatKnobs from "./app/Chat/ChatKnobs/ChatKnobs.svelte"
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
        <div class="chat-header"><ChatHeader/></div>
        <div class="input-bar"><InputBar /></div>
    </div>
</AppFramework>

<style lang="scss">
    .page {
        // display: block;
        box-sizing: border-box;
        width: inherit;
        // height: 100%;
        overflow-y: scroll;
        position: relative;
        // border: 1px solid red;
    }

    .chat-header {
        width: inherit;
        height: auto;
        position: fixed;
        top: 0;
        z-index: 50;
    }

    .input-bar {
        width: inherit;
        position: fixed;
        bottom: 0;
        z-index: 50;
        border: 1px solid red;
    }
</style>
