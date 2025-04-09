<script lang="ts">
    import { chatInProgress, chatNew } from "../../lib/chatSession/chatActions"
    import PopupSystemPresets from "./PopupSystemPresets.svelte"

    let mobileToggleOpen = false

    const popupPreset = {
        event: "click",
        target: "popupPreset",
        placement: "top",
    }

    function newConversationClick() {
        chatNew()
    }
</script>

<div class="new-session">
    <div class="">
        <PopupSystemPresets></PopupSystemPresets>
    </div>
    <div class="">
        <button
            class="btn variant-filled-primary flex-auto"
            title="Start a new session using a blank system prompt."
            onclick={newConversationClick}
            disabled={$chatInProgress}
        >
            New Session
        </button>
        <button
            class=""
            title="Start a new conversation using a system prompt preset."
            disabled={$chatInProgress}
        >
            P
        </button>
        <!--
    <div data-popup="popupPreset">
        <PopupSystemPresets></PopupSystemPresets>
    </div> -->
    </div>
</div>

<style lang="scss">
    :global(.convo-panel.app-rail) {
        background-color: var(--color-surface-800);
    }

    button {
        border-radius: 8px;
        background: transparent;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .new-session {
        display: flex;
        flex-direction: column;
    }
</style>
