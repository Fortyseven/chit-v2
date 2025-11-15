<script lang="ts">
    import { Renew, SendFilled, TrashCan, Undo } from "carbon-icons-svelte"
    import { derived, writable } from "svelte/store"
    import { appActiveChat } from "../../../lib/appState/appState"
    import {
        chatBack,
        chatChopLatest,
        chatClearConversation,
        // $chatInProgress,
        chatLength,
        chatRunInference,
    } from "../../../lib/chatSession/chatActions"
    import { chatClearAllPastedMedia } from "../../../lib/chatSession/chatAttachments"
    import { chats, currentChat } from "../../../lib/chatSession/chatSession"
    import IconButton from "../../UI/IconButton.svelte"
    import ChatOptionsDropdown from "../ChatKnobs/ChatOptionsDropdown.svelte"

    export let inputBoxEl: HTMLTextAreaElement | undefined = undefined
    export let chatInProgress: {
        subscribe: (run: (value: boolean) => void) => () => void
    }
    export let doInputBarSubmit: () => Promise<void>

    /* ------------------------------------------------------ */
    async function onBtnReroll() {
        chatChopLatest()
        await chatRunInference()
    }

    /* ------------------------------------------------------ */
    function onBtnBack() {
        if (chatLength() === 0) {
            chatClearAllPastedMedia()
        } else {
            let usermsg = chatBack()

            if (inputBoxEl && usermsg) {
                inputBoxEl.value = usermsg as string
            }
        }
    }

    /* ------------------------------------------------------ */
    async function onBtnClear() {
        if (inputBoxEl) {
            inputBoxEl.value = ""
        }
        await chatClearAllPastedMedia()
        await chatClearConversation()

        // Dispatch custom event to clear all floating images
        window.dispatchEvent(new CustomEvent("clearFloatingImages"))
    }

    /* ------------------------------------------------------ */
    const hasMessages = derived(
        [chats, appActiveChat],
        ([$chats, $appActiveChat]) => {
            return chatLength() > 0
        },
    )
</script>

<div class="chat-controls">
    <button
        onclick={async () => await doInputBarSubmit()}
        disabled={$chatInProgress}
        class="btn-send"
    >
        <div>
            Send&nbsp;<SendFilled />
        </div>
    </button>
    {#key $hasMessages}
        <div class="btn-grid">
            <IconButton
                title="Reroll last response (Ctrl+E)"
                onClick={onBtnReroll}
                disabled={!$hasMessages || $chatInProgress}
                iconComponent={Renew}
                roundCorner="nw"
            />

            <ChatOptionsDropdown></ChatOptionsDropdown>

            <IconButton
                title="Go back one response (Ctrl+B)"
                onClick={onBtnBack}
                disabled={(!$hasMessages || $chatInProgress) &&
                    !$currentChat?.pastedMedia?.length}
                iconComponent={Undo}
                roundCorner="sw"
            />

            <IconButton
                title="Clear"
                warning
                onClick={onBtnClear}
                disabled={(!$hasMessages || $chatInProgress) &&
                    !$currentChat?.pastedMedia?.length}
                iconComponent={TrashCan}
                roundCorner="se"
            />
        </div>
    {/key}
</div>

<style lang="scss">
    .chat-controls {
        display: flex;
        gap: 0.5em;

        button {
            background-color: var(--color-primary-500);
            flex: auto;
            text-align: center;
            width: calc(var(--spacing) * 24);
            height: 100%;
            line-height: 1;
            &:disabled {
                opacity: 50%;
            }
        }

        button.btn-send div {
            display: flex;
            flex-direction: row;
            place-content: center;
            gap: calc(var(--spacing) * 2);
        }

        .btn-grid {
            width: 100px;
            height: 100%;
            display: grid;
            grid-template-columns: auto auto;
            grid-template-rows: auto auto;
            gap: 2px;
            place-content: center;
            position: relative;
        }
    }
</style>
