<script lang="ts">
    import { Renew, SendFilled, TrashCan, Undo } from "carbon-icons-svelte"
    import { derived } from "svelte/store"
    import { appActiveChat, appState } from "../../../appState/appState"
    import {
        chatAbort,
        chatAddRoleMessage,
        chatBack,
        chatChopLatest,
        chatClearConversation,
        chatInProgress,
        chatLength,
        chatRunInference,
    } from "../../../lib/chatSession/chatActions"
    import { chats } from "../../../lib/chatSession/chatSession"
    import IconButton from "../../UI/IconButton.svelte"
    import ChatOptionsDropdown from "../ChatKnobs/ChatOptionsDropdown.svelte"
    import ChatInferenceSettings from "./ChatInferenceSettings.svelte"

    let inputBoxEl: HTMLTextAreaElement | undefined = undefined

    $: if (inputBoxEl) {
        inputBoxEl.focus()
    }

    /* ------------------------------------------------------ */
    chatInProgress.subscribe((value) => {
        console.log("chatInProgress", value)
        if (inputBoxEl && value == false) {
            setTimeout(() => {
                inputBoxEl?.focus()
            }, 100)
        }
    })

    /* ------------------------------------------------------ */
    async function _submitUserMessage(user_message: String | undefined) {
        if (!inputBoxEl || !$appState.activeChatId) {
            throw new Error("inputBoxEl is not defined or some such")
        }

        if (!user_message) {
            chatAddRoleMessage("", "user", "")
            chatRunInference()
            return
        }

        let presubmit_message = inputBoxEl.value

        try {
            inputBoxEl.value = ""
            inputBoxEl.disabled = true
            let message = user_message //|| inputBoxEl.value
            console.log("submit_user_message", message)

            if (message.trim() === "") {
                return
            }

            chatAddRoleMessage("", "user", message)

            chatRunInference()
        } catch (e) {
            // restore the message if it fails
            inputBoxEl.value = presubmit_message
            console.error(e)
        } finally {
            inputBoxEl.disabled = false
            inputBoxEl.focus()
        }
    }

    /* ------------------------------------------------------ */
    async function onInputKeypress(ev: KeyboardEvent) {
        if (ev.key === "Enter") {
            if (!ev.shiftKey) {
                ev.preventDefault()
                await _submitUserMessage(ev.target.value)
            }
        }
    }

    /* ------------------------------------------------------ */
    async function onGlobalKeypress(ev: KeyboardEvent) {
        if (ev.ctrlKey) {
            // reroll last response
            if (ev.key === "e" && ev.ctrlKey) {
                ev.preventDefault()
                onBtnReroll()
            }

            // go back one response
            if (ev.key === "b" && ev.ctrlKey) {
                ev.preventDefault()
                onBtnBack()
            }

            if (ev.key === "Enter" && ev.ctrlKey && ev.target.value) {
                ev.preventDefault()
                await _submitUserMessage(ev.target.value)
            }
        } else if (ev.key == "Escape") {
            ev.preventDefault()
            chatAbort()
        }
    }

    /* ------------------------------------------------------ */
    function onBtnReroll() {
        chatChopLatest()
        chatRunInference()
    }

    /* ------------------------------------------------------ */
    function onBtnBack() {
        let usermsg = chatBack()

        if (inputBoxEl && usermsg) {
            inputBoxEl.value = usermsg as string
        }
    }

    /* ------------------------------------------------------ */
    function onBtnClear() {
        if (inputBoxEl) {
            inputBoxEl.value = ""
        }
        chatClearConversation()
    }

    /* ------------------------------------------------------ */
    const hasMessages = derived(
        [chats, appActiveChat],
        ([$chats, $appActiveChat]) => {
            return chatLength() > 0
        },
    )
</script>

<svelte:window onkeydown={onGlobalKeypress} />

{#key $appActiveChat}
    <div id="InputBox">
        <div class="flex flex-row gap-2 p-4 max-w-[1024px] m-auto">
            <ChatInferenceSettings></ChatInferenceSettings>
            <div class="flex flex-auto basis-[50%] disabled:opacity-50">
                <textarea
                    name="prompt"
                    id="prompt"
                    class="bg-black"
                    placeholder="Write a message..."
                    rows="1"
                    bind:this={inputBoxEl}
                    onkeypress={onInputKeypress}
                    disabled={$chatInProgress}
                ></textarea>
            </div>
            <div class="flex flex-row flex-auto gap-1 grow-0">
                <button
                    class="bg-primary-500 flex-auto text-center w-24 h-full leading-none disabled:opacity-50"
                    onclick={() => _submitUserMessage(inputBoxEl?.value)}
                    disabled={$chatInProgress}
                >
                    <div class="flex flex-row place-content-center gap-2">
                        Send <SendFilled />
                    </div>
                </button>
                {#key $hasMessages}
                    <div
                        class="grid grid-cols-2 grid-rows-2 gap-1 place-content-center"
                    >
                        <IconButton
                            title="Reroll last response (Ctrl+E)"
                            onClick={onBtnReroll}
                            disabled={!$hasMessages || $chatInProgress}
                            iconComponent={Renew}
                        ></IconButton>
                        <ChatOptionsDropdown></ChatOptionsDropdown>
                        <IconButton
                            title="Go back one response (Ctrl+B)"
                            onClick={onBtnBack}
                            disabled={!$hasMessages || $chatInProgress}
                            iconComponent={Undo}
                        ></IconButton>
                        <IconButton
                            title="Clear"
                            onClick={onBtnClear}
                            disabled={!$hasMessages || $chatInProgress}
                            iconComponent={TrashCan}
                            className="!bg-red-500 hover:!bg-red-400"
                        ></IconButton>
                    </div>
                {/key}
            </div>
        </div>
    </div>
{/key}

<style lang="scss">
    #InputBox {
        border-radius: var(--theme-rounded-container);
        background: #fb01;
        backdrop-filter: blur(15px);
        filter: drop-shadow(0 0 2em #000);
        width: 100%;
        position: sticky;
        padding: 0;
        bottom: 0;
        left: 0;

        textarea {
            border-radius: var(--theme-rounded-container);
            font-size: 1.2em;
            outline-style: none;
            width: 100%;
            height: 100%;
            padding: 0.5em;
            border-top: 1px solid #fff4;
            border-left: 2px solid #fff4;
            border-right: 2px solid #fb04;
            border-bottom: 1px solid #fb04;

            &:disabled {
                opacity: 0.5;
            }

            &.overflow {
                color: #f44;
            }

            &::placeholder {
                color: var(--color-surface-500);
            }
        }
    }
</style>
