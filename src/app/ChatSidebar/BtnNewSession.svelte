<script lang="ts">
    import { popup } from "@skeletonlabs/skeleton"
    import { chatNew } from "../../chatSession/chatActions"
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

<div class="flex flex-col">
    <div class="absolute bottom-[4.5em] overflow-scroll-y">
        <PopupSystemPresets></PopupSystemPresets>
    </div>
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
