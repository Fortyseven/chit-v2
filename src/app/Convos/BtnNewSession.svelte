<script>
    // @ts-nocheck
    import PopupSystemPresets from "./PopupSystemPresets.svelte"

    import { popup } from "@skeletonlabs/skeleton"

    import {
        chatSessionCreate,
        chatSessions,
        setChatSessionIndex,
    } from "../../stores/chatSessions.svelte.js"

    let mobileToggleOpen = $state(false)

    const popupPreset = {
        // Represents the type of event that opens/closed the popup
        event: "click",
        // Matches the data-popup value on your popup element
        target: "popupPreset",
        // Defines which side of your trigger the popup will appear
        placement: "top",
    }

    function newConversationClick() {
        chatSessionCreate()
        setChatSessionIndex($chatSessions.sessions.length - 1)
    }
</script>

<!-- <div class="flex flex-row justify-between"> -->
<div class="btn-group variant-filled-secondary">
    <button
        class="btn variant-filled-primary flex-auto"
        title="Start a new session using a blank system prompt."
        onclick={newConversationClick}
    >
        New Session
    </button>
    <button
        class="btn-icon variant-filled-primary flex-none"
        title="Start a new conversation using a system prompt preset."
        use:popup={popupPreset}
    >
        P
    </button>

    <div data-popup="popupPreset">
        <PopupSystemPresets></PopupSystemPresets>
    </div>
</div>

<style lang="scss">
    :global(.convo-panel.app-rail) {
        background-color: rgb(var(--color-surface-800));
    }

    button {
        border-radius: 8px;
        background: transparent;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
