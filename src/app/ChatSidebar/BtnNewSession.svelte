<script>
    import { Replicate } from "carbon-icons-svelte"
    import { onMount } from "svelte"
    import {
        chatInProgress,
        chatNew,
        chatSetSystemPrompt,
    } from "../../lib/chatSession/chatActions"
    import { currentChat } from "../../lib/chatSession/chatSession"
    import PopupSystemPresets from "./PopupSystemPresets.svelte"

    // let mobileToggleOpen = false

    let popupOpen = false

    const popupPreset = {
        event: "click",
        target: "popupPreset",
        placement: "top",
    }

    function newConversationClick() {
        chatNew()
    }

    function duplicateSession() {
        const currentSystemPrompt = $currentChat.systemPrompt
        const new_id = chatNew()
        chatSetSystemPrompt(new_id, currentSystemPrompt)
    }

    onMount(() => {
        function handleClickOutside(event) {
            const popup = document.querySelector(".preset-popup-container")
            const button = document.querySelector(".btn-preset")
            if (
                popup &&
                !popup.contains(event.target) &&
                button &&
                !button.contains(event.target)
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

<div>
    <div class="sessions">
        <button
            class="btn-new-session"
            title="Start a new session using a blank system prompt."
            onclick={newConversationClick}
            disabled={$chatInProgress}
        >
            New
        </button>
        <button
            class="btn-duplicate"
            title="Start a new conversation using the current system prompt."
            disabled={$chatInProgress}
            onclick={() => duplicateSession()}
        >
            <Replicate />
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
        grid-template-columns: 1fr auto auto;

        button {
            &.btn-new-session {
                border-top-right-radius: 0;
                border-bottom-right-radius: 0;
            }

            &.btn-duplicate {
                border-radius: 0;
                border-left-color: var(--color-accent-darker);
                border-left-style: solid;
                border-left-width: 1px;
                line-height: 0;
            }

            &.btn-preset {
                // background-color: var(--color-accent-lighter);
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;
                border-left-color: var(--color-accent-darker);
                border-left-style: solid;
                border-left-width: 1px;
            }
        }

        .preset-popup-container {
            position: absolute;
            bottom: 45px;
            left: 24px;
            width: 256px;
            z-index: 100;
        }
    }
</style>
