<script lang="ts">
    import { onMount } from "svelte"
    import { chatInProgress, chatNew } from "../../lib/chatSession/chatActions"
    import PopupSystemPresets from "./PopupSystemPresets.svelte"

    let mobileToggleOpen = false

    let popupOpen = false

    const popupPreset = {
        event: "click",
        target: "popupPreset",
        placement: "top",
    }

    function newConversationClick() {
        chatNew()
    }

    onMount(() => {
        function handleClickOutside(event: MouseEvent) {
            const popup = document.querySelector(".preset-popup-container")
            const button = document.querySelector(".btn-preset")
            if (
                popup &&
                !popup.contains(event.target as Node) &&
                button &&
                !button.contains(event.target as Node)
            ) {
                popupOpen = false
            }
        }

        document.addEventListener("click", handleClickOutside)

        return () => {
            document.removeEventListener("click", handleClickOutside)
        }
    })
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
            onclick={() => (popupOpen = !popupOpen)}
        >
            ...
        </button>
        <div class="preset-popup-container">
            <PopupSystemPresets open={popupOpen} />
        </div>
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

        .preset-popup-container {
            position: absolute;
            bottom: 45px;
            left: 50px;
            width: 256px;
            z-index: 100;
        }
    }
</style>
