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

<div class="">
    <div class="sessions">
        <button
            class="btn-new-session"
            title="Start a new session using a blank system prompt."
            onclick={newConversationClick}
            disabled={$chatInProgress}
        >
            New Session
        </button>
        <button
            class="btn-preset"
            title="Start a new conversation using a system prompt preset."
            disabled={$chatInProgress}
        >
            ...
        </button>
        <!--
    <div data-popup="popupPreset">
        <PopupSystemPresets></PopupSystemPresets>
    </div> -->
    </div>
    <div class="">
        <!-- <PopupSystemPresets/> -->
    </div>
</div>

<style lang="scss">
    .sessions {
        display: grid;
        grid-template-columns: 1fr auto;
        button {
            &.btn-new-session {
                border-top-right-radius: 0;
                border-bottom-right-radius: 0;
            }

            &.btn-preset {
                // background-color: var(--color-accent-lighter);
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;
                border-left-color: var(--color-accent-darker);
                border-left-style: solid;
                border-left-width: 2px;
                vertical-align: middle;
            }
        }

        .new-session {
            // display: flex;
            // flex-direction: column;
        }
    }
</style>
