<script lang="ts">
    import ChatOptionsDropdown from "$app/Chat/Timeline/ChatHeader/ChatKnobs/ChatOptionsDropdown.svelte"
    import IconButton from "$app/UI/IconButton.svelte"
    import { appActiveChat } from "$lib/appState/appState"
    import {
        chatBack,
        chatChopLatest,
        chatClearConversation,
        chatClearConversationKeepMedia,
        // $chatInProgress,
        chatLength,
        chatRunInference,
    } from "$lib/chatSession/chatActions"
    import { chatClearAllPastedMedia } from "$lib/chatSession/chatAttachments"
    import { chats, currentChat } from "$lib/chatSession/chatSession"
    import {
        Delete,
        Replay,
        Send,
        Undo,
    } from "svelte-google-materialdesign-icons"
    import { derived, writable } from "svelte/store"

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
    function onBtnBack(btn: HTMLButtonElement, ev: MouseEvent) {
        // If CTRL/Cmd is held during mouse click, clear timeline but keep media
        if (ev.ctrlKey || ev.metaKey) {
            chatClearConversationKeepMedia()
            return
        }

        // Normal back behavior
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
    // Clearing requires two clicks: the first click "arms" the button
    // (its color changes), the second click actually clears. Any other
    // action (clicking elsewhere, pressing a key, scrolling) resets it.
    let clearArmed = false
    let clearBtnWrap: HTMLDivElement | undefined = undefined

    $: isClearDisabled =
        (!$hasMessages || $chatInProgress) && !$currentChat?.pastedMedia?.length

    // The armed state can never survive on a disabled button
    $: if (isClearDisabled) {
        clearArmed = false
    }

    function clearBtnContains(target: EventTarget | null): boolean {
        return (
            clearBtnWrap != null &&
            target instanceof Node &&
            clearBtnWrap.contains(target)
        )
    }

    // Listened in the capture phase so stopPropagation() elsewhere
    // (e.g. the chat options dropdown) can't hide events from us
    function onAnyAction(ev: Event) {
        if (clearArmed && !clearBtnContains(ev.target)) {
            clearArmed = false
        }
    }

    function onGlobalKeypress(ev: KeyboardEvent) {
        // Enter/Space on the armed button itself confirms the clear
        const isConfirm =
            (ev.key === "Enter" || ev.key === " ") && clearBtnContains(ev.target)
        if (clearArmed && !isConfirm) {
            clearArmed = false
        }
    }

    /* ------------------------------------------------------ */
    async function onBtnClear() {
        if (!clearArmed) {
            clearArmed = true
            return
        }
        clearArmed = false

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

<svelte:window
    on:click|capture={onAnyAction}
    on:wheel|capture={onAnyAction}
    on:keydown|capture={onGlobalKeypress}
/>
<div class="chat-controls">
    <button
        onclick={async () => await doInputBarSubmit()}
        disabled={$chatInProgress}
        class="btn-send"
    >
        <div>
            Send&nbsp;<Send />
        </div>
    </button>
    {#key $hasMessages}
        <div class="btn-grid">
            <IconButton
                title="Reroll last response (Ctrl+E)"
                onClick={onBtnReroll}
                disabled={!$hasMessages || $chatInProgress}
                iconComponent={Replay}
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

            <div class="clear-wrap" bind:this={clearBtnWrap}>
                <IconButton
                    title={clearArmed ? "Click again to clear" : "Clear"}
                    warning
                    danger={clearArmed}
                    onClick={onBtnClear}
                    disabled={isClearDisabled}
                    iconComponent={Delete}
                    roundCorner="se"
                />
            </div>
        </div>
    {/key}
</div>

<style lang="scss">
    .chat-controls {
        display: flex;
        gap: 0.5em;

        button {
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

        .clear-wrap {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
</style>
