<script>
    import { SvelteToast } from "@zerodevx/svelte-toast"
    import InputBar from "./app/Chat/InputBar/InputBar.svelte"
    import ChatHeader from "./app/Chat/Timeline/ChatHeader/ChatHeader.svelte"
    import ConvoSidebar from "./app/ChatSidebar/Sidebar.svelte"
    import ModeSidebar from "./app/ModeSidebar/ModeSidebar.svelte"
    import PageContent from "./app/PageContent.svelte"
    import AppFramework from "./app/UI/AppFramework/AppFramework.svelte"
    import ConfirmationDialog from "./app/UI/ConfirmationDialog.svelte"

    import "./lib/appState/appStateStorage"
    import "./lib/audio"
    import { chatCompactConversation } from "./lib/chatSession/chatActions"
    import { AppMode, currentChatMode } from "./lib/chatSession/chatSession"
    import "./lib/chatSession/chatStorage"
    import {
        closeCompactConversationDialog,
        compactConversationDialog,
    } from "./lib/chatSession/compactConversationDialog"

    const toastOptions = {
        //...
    }

    $: isRPMode = $currentChatMode === AppMode.RP

    async function confirmCompactConversation() {
        const state = $compactConversationDialog
        if (!state.chatId || !state.summary) {
            closeCompactConversationDialog()
            return
        }

        try {
            await chatCompactConversation(state.chatId, state.summary)
        } catch (error) {
            console.error("Error compacting conversation:", error)
        } finally {
            closeCompactConversationDialog()
        }
    }
</script>

<AppFramework hasModeSidebar={isRPMode}>
    <div slot="sidebar" class="sidebar">
        <ConvoSidebar />
    </div>
    <div slot="mode-sidebar" class="mode-sidebar">
        {#if isRPMode}
            <ModeSidebar />
        {/if}
    </div>
    <div slot="content" class="page">
        <PageContent />
        <div class="chat-header"><ChatHeader /></div>
        <div class="input-bar"><InputBar /></div>
    </div>
</AppFramework>

<ConfirmationDialog
    open={$compactConversationDialog.open}
    title="Compact Conversation"
    message={$compactConversationDialog.summary}
    confirmText="Apply Summary"
    cancelText="Cancel"
    onConfirm={confirmCompactConversation}
    onCancel={closeCompactConversationDialog}
/>
<SvelteToast options={toastOptions} />

<style lang="scss">
    .page {
        box-sizing: border-box;
        width: inherit;
        overflow-y: hidden;
        position: relative;
    }

    .mode-sidebar {
        height: 100%;
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
